from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import datetime
from config import Config
from database import execute_query

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    required_fields = ['student_id_str', 'name', 'email', 'username', 'password']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'{field} is required'}), 400
            
    # Check if student already exists (by email or student_id string)
    check_student_query = "SELECT id FROM students WHERE email = %s OR student_id = %s"
    existing_student = execute_query(check_student_query, (data['email'], data['student_id_str']), fetch_one=True)
    
    if existing_student:
        return jsonify({'error': 'Student with this email or ID already exists'}), 409
        
    # Check if username already exists
    check_user_query = "SELECT id FROM users WHERE username = %s"
    existing_user = execute_query(check_user_query, (data['username'],), fetch_one=True)
    
    if existing_user:
        return jsonify({'error': 'Username already taken'}), 409
        
    try:
        # Create student record first
        student_query = "INSERT INTO students (student_id, name, email) VALUES (%s, %s, %s)"
        student_id = execute_query(student_query, (data['student_id_str'], data['name'], data['email']), commit=True)
        
        if not student_id:
            return jsonify({'error': 'Failed to create student record'}), 500
            
        # Create user record
        hashed_password = generate_password_hash(data['password'])
        user_query = "INSERT INTO users (student_id, username, password_hash) VALUES (%s, %s, %s)"
        user_id = execute_query(user_query, (student_id, data['username'], hashed_password), commit=True)
        
        if not user_id:
            # Rollback technically needed, but for simplicity we assume success if student created
            return jsonify({'error': 'Failed to create user record'}), 500
            
        return jsonify({'message': 'Registration successful'}), 201
        
    except Exception as e:
        print(f"Registration error: {e}")
        return jsonify({'error': 'An error occurred during registration'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data or not data.get('username') or not data.get('password'):
        return jsonify({'error': 'Username and password are required'}), 400
        
    # Get user
    user_query = "SELECT * FROM users WHERE username = %s"
    user = execute_query(user_query, (data['username'],), fetch_one=True)
    
    if not user:
        return jsonify({'error': 'Invalid username or password'}), 401
        
    if check_password_hash(user['password_hash'], data['password']):
        # Generate JWT token
        token = jwt.encode({
            'student_id': user['student_id'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
        }, Config.SECRET_KEY, algorithm="HS256")
        
        # Get student details to return
        student_query = "SELECT id, student_id, name, email FROM students WHERE id = %s"
        student = execute_query(student_query, (user['student_id'],), fetch_one=True)
        
        return jsonify({
            'token': token,
            'student': student
        }), 200
        
    return jsonify({'error': 'Invalid username or password'}), 401
