import mysql.connector
from mysql.connector import Error
from config import Config

def get_db_connection():
    try:
        connection = mysql.connector.connect(
            host=Config.MYSQL_HOST,
            user=Config.MYSQL_USER,
            password=Config.MYSQL_PASSWORD,
            database=Config.MYSQL_DB,
            port=Config.MYSQL_PORT
        )
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def execute_query(query, params=None, fetch_one=False, fetch_all=False, commit=False):
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
        print(f"Database error: {e}")
        cursor.close()
        connection.close()
        return None