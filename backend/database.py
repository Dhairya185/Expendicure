import mysql.connector
from mysql.connector import Error
from config import Config

def get_db_connection(database_name=None):
    """
    Establishes and returns a MySQL database connection using environment-based configuration.
    Supports local MySQL and managed cloud MySQL instances (AWS RDS, PlanetScale, TiDB, Aiven, GCP).
    """
    try:
        conn_kwargs = {
            "host": Config.DB_HOST,
            "user": Config.DB_USER,
            "password": Config.DB_PASSWORD,
            "port": Config.DB_PORT,
            "autocommit": False
        }

        # Select database unless specifically omitted (e.g. when creating the initial database)
        target_db = database_name if database_name is not None else Config.DB_NAME
        if target_db:
            conn_kwargs["database"] = target_db

        # Configure SSL if provided for cloud providers
        if Config.DB_SSL_CA:
            conn_kwargs["ssl_ca"] = Config.DB_SSL_CA
            conn_kwargs["ssl_verify_cert"] = True
        elif Config.DB_SSL_DISABLED:
            conn_kwargs["ssl_disabled"] = True

        connection = mysql.connector.connect(**conn_kwargs)
        return connection
    except Error as e:
        print(f"Error connecting to MySQL ({Config.DB_HOST}:{Config.DB_PORT}): {e}")
        return None

def execute_query(query, params=None, fetch_one=False, fetch_all=False, commit=False):
    """
    Executes a SQL query safely, managing cursor and connection cleanup.
    """
    connection = get_db_connection()
    if not connection:
        return None
    cursor = connection.cursor(dictionary=True)
    try:
        cursor.execute(query, params or ())
        if commit:
            connection.commit()
            lastrowid = cursor.lastrowid
            cursor.close()
            connection.close()
            return lastrowid
        if fetch_one:
            result = cursor.fetchone()
        elif fetch_all:
            result = cursor.fetchall()
        else:
            result = None
        cursor.close()
        connection.close()
        return result
    except Error as e:
        print(f"Database error executing query: {e}")
        cursor.close()
        connection.close()
        return None