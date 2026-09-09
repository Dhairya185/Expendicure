import ssl
import threading
import mysql.connector
from mysql.connector import Error, pooling
from config import Config

_db_pool = None
_pool_lock = threading.Lock()

def get_db_pool():
    """
    Initializes and returns a thread-safe singleton MySQLConnectionPool.
    Reuses existing connections to eliminate TCP/SSL handshake overhead.
    """
    global _db_pool
    if _db_pool is not None:
        return _db_pool

    with _pool_lock:
        if _db_pool is not None:
            return _db_pool

        conn_kwargs = {
            "pool_name": "expendicure_pool",
            "pool_size": getattr(Config, 'DB_POOL_SIZE', 5),
            "pool_reset_session": False,
            "host": Config.DB_HOST,
            "user": Config.DB_USER,
            "password": Config.DB_PASSWORD,
            "port": Config.DB_PORT,
            "database": Config.DB_NAME,
            "autocommit": True,
            "use_pure": True
        }

        # Configure SSL preserving exact cloud/Aiven configuration
        if Config.DB_SSL_CA:
            conn_kwargs["ssl_ca"] = Config.DB_SSL_CA
            conn_kwargs["ssl_verify_cert"] = True
        elif Config.DB_SSL_DISABLED:
            conn_kwargs["ssl_disabled"] = True

        try:
            _db_pool = pooling.MySQLConnectionPool(**conn_kwargs)
            return _db_pool
        except Error as e:
            print(f"Error creating MySQL connection pool ({Config.DB_HOST}:{Config.DB_PORT}): {e}")
            return None


def get_request_connection():
    """
    Returns a connection scoped to the current Flask request.
    Within one request, the same pooled connection is reused for all queries,
    avoiding repeated pool.get_connection() / close() overhead (~3.7s each on Aiven).
    If not in a Flask request context (e.g. scripts/CLI), falls back to get_db_connection().
    The connection is returned to the pool by close_request_connection() at teardown.
    """
    try:
        from flask import g
        conn = getattr(g, '_db_conn', None)
        if conn is not None:
            # Verify the connection is still alive; reconnect if stale
            try:
                conn.ping(reconnect=True, attempts=1, delay=0)
                return conn
            except Exception:
                pass  # Fall through to acquire a new connection

        pool = get_db_pool()
        if pool:
            try:
                conn = pool.get_connection()
                g._db_conn = conn
                return conn
            except Error as e:
                print(f"Error acquiring connection from MySQL pool: {e}")
                return None
        return None
    except RuntimeError:
        # Outside a Flask application context (e.g. CLI scripts / init_db)
        return get_db_connection()


def close_request_connection(error=None):
    """
    Returns the per-request connection back to the pool at Flask request teardown.
    Register this via: app.teardown_appcontext(close_request_connection)
    """
    try:
        from flask import g
        conn = getattr(g, '_db_conn', None)
        if conn is not None:
            g._db_conn = None
            try:
                conn.close()  # Returns connection to pool, does not close the socket
            except Exception:
                pass
    except RuntimeError:
        pass


def get_db_connection(database_name=None):
    """
    Acquires and returns a pooled MySQL database connection.
    For normal requests, prefer get_request_connection() instead.
    If database_name differs from Config.DB_NAME (e.g. provisioning), falls back
    to a direct (non-pooled) connection.
    """
    target_db = database_name if database_name is not None else Config.DB_NAME

    if target_db == Config.DB_NAME:
        pool = get_db_pool()
        if pool:
            try:
                return pool.get_connection()
            except Error as e:
                print(f"Error acquiring connection from MySQL pool: {e}")
                return None
        return None

    # Fallback: direct connection for initial db provisioning
    try:
        conn_kwargs = {
            "host": Config.DB_HOST,
            "user": Config.DB_USER,
            "password": Config.DB_PASSWORD,
            "port": Config.DB_PORT,
            "autocommit": True,
            "use_pure": True
        }
        if target_db:
            conn_kwargs["database"] = target_db
        if Config.DB_SSL_CA:
            conn_kwargs["ssl_ca"] = Config.DB_SSL_CA
            conn_kwargs["ssl_verify_cert"] = True
        elif Config.DB_SSL_DISABLED:
            conn_kwargs["ssl_disabled"] = True
        return mysql.connector.connect(**conn_kwargs)
    except Error as e:
        print(f"Error connecting to MySQL ({Config.DB_HOST}:{Config.DB_PORT}): {e}")
        return None


def execute_query(query, params=None, fetch_one=False, fetch_all=False, commit=False, _conn=None):
    """
    Executes a SQL query safely.

    If _conn is provided (a shared request-scoped connection), it is used directly
    and NOT closed after the query — allowing multiple queries in one request to share
    a single live connection with no get/release overhead.

    If _conn is None, a fresh connection is acquired from the pool and released in
    the finally block (used for standalone/non-request calls).
    """
    owned = _conn is None  # We own the connection only if we created it here
    connection = _conn if _conn is not None else get_request_connection()

    if not connection:
        return None

    cursor = None
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, params or ())
        if commit:
            if not connection.autocommit:
                connection.commit()
            lastrowid = cursor.lastrowid
            return lastrowid
        if fetch_one:
            return cursor.fetchone()
        if fetch_all:
            return cursor.fetchall()
        return None
    except Error as e:
        print(f"Database error executing query: {e}")
        if commit and not connection.autocommit:
            try:
                connection.rollback()
            except Exception:
                pass
        return None
    finally:
        if cursor:
            try:
                cursor.close()
            except Exception:
                pass
        # Only close (return to pool) if we own the connection
        if owned and connection:
            try:
                connection.close()
            except Exception:
                pass