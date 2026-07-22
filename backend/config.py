import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
    
    # MySQL Configuration
    MYSQL_HOST = os.environ.get('MYSQL_HOST') or 'localhost'
    MYSQL_USER = os.environ.get('MYSQL_USER') or 'root'
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD') or ''
    MYSQL_DB = os.environ.get('MYSQL_DB') or 'expendicure'
    MYSQL_PORT = int(os.environ.get('MYSQL_PORT') or 3306)
    
    # Flask Configuration
    DEBUG = os.environ.get('FLASK_DEBUG') or 'False'
    DEBUG = DEBUG.lower() in ['true', '1', 'yes']