import os
from urllib.parse import urlparse
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Security / Session
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'

    # Database Configuration from environment variables
    # Prioritizes standard DB_* environment variables, with backward compatibility for MYSQL_*
    # Supports DATABASE_URL if provided by cloud providers (Railway, Render, Heroku, etc.)
    DATABASE_URL = os.environ.get('DATABASE_URL')
    if DATABASE_URL and DATABASE_URL.startswith('mysql'):
        parsed_url = urlparse(DATABASE_URL)
        DB_HOST = parsed_url.hostname or 'localhost'
        DB_PORT = parsed_url.port or 3306
        DB_USER = parsed_url.username or 'root'
        DB_PASSWORD = parsed_url.password or ''
        DB_NAME = (parsed_url.path or '/expendicure').lstrip('/')
    else:
        DB_HOST = os.environ.get('DB_HOST') or os.environ.get('MYSQL_HOST') or 'localhost'
        DB_PORT = int(os.environ.get('DB_PORT') or os.environ.get('MYSQL_PORT') or 3306)
        DB_NAME = os.environ.get('DB_NAME') or os.environ.get('MYSQL_DB') or 'expendicure'
        DB_USER = os.environ.get('DB_USER') or os.environ.get('MYSQL_USER') or 'root'
        DB_PASSWORD = os.environ.get('DB_PASSWORD') or os.environ.get('MYSQL_PASSWORD') or ''

    # Backward compatibility aliases for existing code
    MYSQL_HOST = DB_HOST
    MYSQL_PORT = DB_PORT
    MYSQL_DB = DB_NAME
    MYSQL_USER = DB_USER
    MYSQL_PASSWORD = DB_PASSWORD

    # Cloud SSL / TLS options (e.g. AWS RDS, TiDB, Aiven, GCP Cloud SQL)
    DB_SSL_CA = os.environ.get('DB_SSL_CA')
    DB_SSL_DISABLED = os.environ.get('DB_SSL_DISABLED', 'false').lower() in ['true', '1', 'yes']

    # Flask Configuration
    DEBUG = os.environ.get('FLASK_DEBUG', 'False').lower() in ['true', '1', 'yes']