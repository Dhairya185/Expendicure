from functools import wraps
from flask import request, jsonify
import jwt
from config import Config
from database import execute_query

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Check if the token is passed in the headers
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(' ')[1]
            else:
                token = auth_header
                
        if not token:
            return jsonify({'error': 'Token is missing!'}), 401
            
        try:
            # Decode the token
            data = jwt.decode(token, Config.SECRET_KEY, algorithms=["HS256"])
            student_id = data['student_id']
            
            # Verify the student exists
            query = "SELECT id, student_id, name, email FROM students WHERE id = %s"
            current_student = execute_query(query, (student_id,), fetch_one=True)
            
            if not current_student:
                return jsonify({'error': 'Student not found!'}), 401
                
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid!'}), 401
            
        # Pass the current student info to the route
        return f(current_student, *args, **kwargs)
        
    return decorated
