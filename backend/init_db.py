import os
import sys
import mysql.connector
from config import Config

def init_database():
    """
    Initializes the Expendicure database schema on local or cloud MySQL instance.
    Reads connection details from environment variables (DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD).
    """
    print("=" * 65)
    print("Expendicure Database Initialization & Migration Tool")
    print("=" * 65)
    print(f"Target Host : {Config.DB_HOST}:{Config.DB_PORT}")
    print(f"Target DB   : {Config.DB_NAME}")
    print(f"User        : {Config.DB_USER}")
    print("-" * 65)

    # 1. Connect without database selected to ensure database exists
    conn_params = {
        "host": Config.DB_HOST,
        "user": Config.DB_USER,
        "password": Config.DB_PASSWORD,
        "port": Config.DB_PORT
    }
    if Config.DB_SSL_CA:
        conn_params["ssl_ca"] = Config.DB_SSL_CA
        conn_params["ssl_verify_cert"] = True
    elif Config.DB_SSL_DISABLED:
        conn_params["ssl_disabled"] = True

    try:
        print("[1/3] Connecting to MySQL server...")
        conn = mysql.connector.connect(**conn_params)
        cursor = conn.cursor()

        # Create database if not exists
        print(f"[2/3] Ensuring database `{Config.DB_NAME}` exists...")
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{Config.DB_NAME}` DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci")
        cursor.close()
        conn.close()

        # 2. Connect directly to target database and execute init_db.sql
        conn_params["database"] = Config.DB_NAME
        conn = mysql.connector.connect(**conn_params)
        cursor = conn.cursor()

        schema_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'init_db.sql')
        if not os.path.exists(schema_path):
            schema_path = os.path.join(os.path.dirname(__file__), 'database', 'init_db.sql')

        print(f"[3/3] Applying schema from {schema_path}...")
        with open(schema_path, 'r', encoding='utf-8') as f:
            sql_script = f.read()

        # Split and execute non-empty statements
        statements = [stmt.strip() for stmt in sql_script.split(';') if stmt.strip()]
        for stmt in statements:
            # Skip USE or CREATE DATABASE inside the target connection to avoid errors
            if stmt.upper().startswith('USE ') or stmt.upper().startswith('CREATE DATABASE'):
                continue
            cursor.execute(stmt)

        conn.commit()
        cursor.close()
        conn.close()

        print("-" * 65)
        print("[SUCCESS] Database initialized and ready for production deployment!")
        print("=" * 65)
        return True
    except mysql.connector.Error as err:
        print(f"[ERROR] initializing database: {err}", file=sys.stderr)
        return False

if __name__ == '__main__':
    success = init_database()
    sys.exit(0 if success else 1)
