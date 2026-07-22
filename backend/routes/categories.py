from flask import Blueprint, jsonify, request
from database import execute_query
from middleware import token_required

categories_bp = Blueprint('categories', __name__)

@categories_bp.route('/', methods=['GET'], strict_slashes=False)
@token_required
def get_categories(current_student):
    query = "SELECT id, name, is_default, created_at FROM categories ORDER BY name"
    categories = execute_query(query, fetch_all=True)
    if categories is None:
        return jsonify({"error": "Failed to fetch categories"}), 500
    return jsonify(categories)

@categories_bp.route('/', methods=['POST'], strict_slashes=False)
@token_required
def add_category(current_student):
    data = request.get_json()
    if 'name' not in data:
        return jsonify({"error": "name is required"}), 400
    
    # Check if category already exists
    check_query = "SELECT id FROM categories WHERE name = %s"
    existing = execute_query(check_query, (data['name'],), fetch_one=True)
    if existing:
        return jsonify({"error": "Category already exists"}), 409
    
    query = "INSERT INTO categories (name, is_default) VALUES (%s, %s)"
    params = (data['name'], data.get('is_default', False))
    category_id = execute_query(query, params, commit=True)
    if category_id is None:
        return jsonify({"error": "Failed to add category"}), 500
    
    # Fetch the newly added category
    new_category = execute_query(
        "SELECT id, name, is_default, created_at FROM categories WHERE id = %s",
        (category_id,),
        fetch_one=True
    )
    return jsonify(new_category), 201

@categories_bp.route('/<int:category_id>', methods=['PUT'])
@token_required
def update_category(current_student, category_id):
    data = request.get_json()
    if 'name' not in data:
        return jsonify({"error": "name is required"}), 400
    
    # Check if category exists
    check_query = "SELECT id FROM categories WHERE id = %s"
    category = execute_query(check_query, (category_id,), fetch_one=True)
    if category is None:
        return jsonify({"error": "Category not found"}), 404
    
    # Check if new name already exists (excluding current category)
    if 'name' in data:
        check_query = "SELECT id FROM categories WHERE name = %s AND id != %s"
        existing = execute_query(check_query, (data['name'], category_id), fetch_one=True)
        if existing:
            return jsonify({"error": "Category name already exists"}), 409
    
    # Update category
    update_query = "UPDATE categories SET name = %s WHERE id = %s"
    params = (data['name'], category_id)
    result = execute_query(update_query, params, commit=True)
    if result is None:
        return jsonify({"error": "Failed to update category"}), 500
    
    # Fetch the updated category
    updated_category = execute_query(
        "SELECT id, name, is_default, created_at FROM categories WHERE id = %s",
        (category_id,),
        fetch_one=True
    )
    return jsonify(updated_category)

@categories_bp.route('/<int:category_id>', methods=['DELETE'])
@token_required
def delete_category(current_student, category_id):
    # Check if category exists
    check_query = "SELECT id FROM categories WHERE id = %s"
    category = execute_query(check_query, (category_id,), fetch_one=True)
    if category is None:
        return jsonify({"error": "Category not found"}), 404
    
    # Check if category is being used in transactions
    check_usage = "SELECT COUNT(*) as count FROM transactions WHERE category_id = %s"
    usage = execute_query(check_usage, (category_id,), fetch_one=True)
    if usage and usage['count'] > 0:
        return jsonify({"error": "Cannot delete category that is being used in transactions"}), 400
    
    # Check if category is being used in budgets
    check_budget_usage = "SELECT COUNT(*) as count FROM budgets WHERE category_id = %s"
    budget_usage = execute_query(check_budget_usage, (category_id,), fetch_one=True)
    if budget_usage and budget_usage['count'] > 0:
        return jsonify({"error": "Cannot delete category that is being used in budgets"}), 400
    
    # Delete the category
    delete_query = "DELETE FROM categories WHERE id = %s"
    result = execute_query(delete_query, (category_id,), commit=True)
    if result is None:
        return jsonify({"error": "Failed to delete category"}), 500
    
    return jsonify({"message": "Category deleted successfully"}), 200