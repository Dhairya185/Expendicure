from flask import Blueprint, jsonify, request
from database import execute_query

students_bp = Blueprint('students', __name__)

@students_bp.route('/', methods=['GET'])
def get_students():
    query = "SELECT id, student_id, name, email, created_at FROM students"
    students = execute_query(query, fetch_all=True)
    if students is None:
        return jsonify({"error": "Failed to fetch students"}), 500
    return jsonify(students)

@students_bp.route('/<int:student_id>', methods=['GET'])
def get_student(student_id):
    query = "SELECT id, student_id, name, email, created_at FROM students WHERE id = %s"
    student = execute_query(query, (student_id,), fetch_one=True)
    if student is None:
        return jsonify({"error": "Student not found"}), 404
    return jsonify(student)