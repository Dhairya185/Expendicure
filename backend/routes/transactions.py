from flask import Blueprint, jsonify, request
from database import execute_query
import datetime
from middleware import token_required

transactions_bp = Blueprint('transactions', __name__)

@transactions_bp.route('/', methods=['GET'], strict_slashes=False)
@token_required
def get_transactions(current_student):
    student_id = current_student['id']
    
    query = """
        SELECT t.id, t.amount, t.merchant_name, t.payment_date, t.payment_method, t.notes,
               c.name AS category_name, t.created_at, t.updated_at
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.student_id = %s
        ORDER BY t.payment_date DESC, t.created_at DESC
    """
    transactions = execute_query(query, (student_id,), fetch_all=True)
    if transactions is None:
        return jsonify({"error": "Failed to fetch transactions"}), 500
    return jsonify(transactions)

@transactions_bp.route('/', methods=['POST'], strict_slashes=False)
@token_required
def add_transaction(current_student):
    student_id = current_student['id']
    data = request.get_json()
    required_fields = ['amount', 'merchant_name', 'category_id', 'payment_date']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"{field} is required"}), 400
    
    query = """
        INSERT INTO transactions (student_id, amount, merchant_name, category_id, payment_date, payment_method, notes)
        VALUES (%s, %s, %s, %s, %s, %s, %s)
    """
    params = (
        student_id,
        data['amount'],
        data['merchant_name'],
        data['category_id'],
        data['payment_date'],
        data.get('payment_method'),
        data.get('notes')
    )
    transaction_id = execute_query(query, params, commit=True)
    if transaction_id is None:
        return jsonify({"error": "Failed to add transaction"}), 500
    
    # Fetch the newly added transaction to return
    new_transaction = execute_query(
        """
        SELECT t.id, t.amount, t.merchant_name, t.payment_date, t.payment_method, t.notes,
               c.name AS category_name, t.created_at, t.updated_at
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.id = %s
        """,
        (transaction_id,),
        fetch_one=True
    )
    return jsonify(new_transaction), 201

@transactions_bp.route('/<int:transaction_id>', methods=['PUT'])
@token_required
def update_transaction_category(current_student, transaction_id):
    student_id = current_student['id']
    data = request.get_json()
    if 'category_id' not in data:
        return jsonify({"error": "category_id is required"}), 400
    
    # First, check if the transaction exists and belongs to student
    check_query = "SELECT id FROM transactions WHERE id = %s AND student_id = %s"
    transaction = execute_query(check_query, (transaction_id, student_id), fetch_one=True)
    if transaction is None:
        return jsonify({"error": "Transaction not found or unauthorized"}), 404
    
    # Update the category
    update_query = "UPDATE transactions SET category_id = %s WHERE id = %s"
    result = execute_query(update_query, (data['category_id'], transaction_id), commit=True)
    if result is None:
        return jsonify({"error": "Failed to update transaction"}), 500
    
    # Fetch the updated transaction
    updated_transaction = execute_query(
        """
        SELECT t.id, t.amount, t.merchant_name, t.payment_date, t.payment_method, t.notes,
               c.name AS category_name, t.created_at, t.updated_at
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.id = %s
        """,
        (transaction_id,),
        fetch_one=True
    )
    return jsonify(updated_transaction)

@transactions_bp.route('/<int:transaction_id>', methods=['DELETE'])
@token_required
def delete_transaction(current_student, transaction_id):
    student_id = current_student['id']
    # Check if transaction exists and belongs to student
    check_query = "SELECT id FROM transactions WHERE id = %s AND student_id = %s"
    transaction = execute_query(check_query, (transaction_id, student_id), fetch_one=True)
    if transaction is None:
        return jsonify({"error": "Transaction not found or unauthorized"}), 404
    
    # Delete the transaction
    delete_query = "DELETE FROM transactions WHERE id = %s"
    result = execute_query(delete_query, (transaction_id,), commit=True)
    if result is None:
        return jsonify({"error": "Failed to delete transaction"}), 500
    
    return jsonify({"message": "Transaction deleted successfully"}), 200