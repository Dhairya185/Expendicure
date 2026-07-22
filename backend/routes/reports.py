from flask import Blueprint, jsonify, request
from database import execute_query
import datetime
from middleware import token_required

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/chart-data', methods=['GET'])
@token_required
def get_chart_data(current_student):
    student_id = current_student['id']
    # Get query parameters for filtering
    category = request.args.get('category')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    month = request.args.get('month')  # Format: YYYY-MM
    
    # Base query for transactions
    base_query = """
        SELECT t.id, t.amount, t.merchant_name, t.payment_date, t.payment_method, t.notes,
               c.name AS category_name, c.id AS category_id
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.student_id = %s
    """
    params = [student_id]
    
    # Add filters
    if category:
        base_query += " AND c.name = %s"
        params.append(category)
    
    if start_date:
        base_query += " AND t.payment_date >= %s"
        params.append(start_date)
    
    if end_date:
        base_query += " AND t.payment_date <= %s"
        params.append(end_date)
    
    if month:
        base_query += " AND DATE_FORMAT(t.payment_date, '%Y-%m') = %s"
        params.append(month)
    
    base_query += " ORDER BY t.payment_date DESC"
    
    # Get transactions for charts and table
    transactions = execute_query(base_query, tuple(params), fetch_all=True)
    if transactions is None:
        return jsonify({"error": "Failed to fetch transactions"}), 500
    
    # Prepare data for pie chart (category-wise spending for the filtered period)
    pie_query = """
        SELECT c.name AS category_name, 
               COALESCE(SUM(t.amount), 0) AS total_spent
        FROM categories c
        LEFT JOIN transactions t ON c.id = t.category_id AND t.student_id = %s
    """
    pie_params = [student_id]
    
    # Apply same filters to pie chart query (except ordering)
    if category:
        pie_query += " AND c.name = %s"
        pie_params.append(category)
    
    if start_date:
        pie_query += " AND t.payment_date >= %s"
        pie_params.append(start_date)
    
    if end_date:
        pie_query += " AND t.payment_date <= %s"
        pie_params.append(end_date)
    
    if month:
        pie_query += " AND DATE_FORMAT(t.payment_date, '%Y-%m') = %s"
        pie_params.append(month)
    
    pie_query += " GROUP BY c.id, c.name ORDER BY total_spent DESC"
    
    pie_data = execute_query(pie_query, tuple(pie_params), fetch_all=True)
    if pie_data is None:
        return jsonify({"error": "Failed to fetch pie chart data"}), 500
    
    # Prepare data for bar chart (monthly spending trend)
    # Get last 6 months of data
    bar_query = """
        SELECT DATE_FORMAT(t.payment_date, '%Y-%m') AS month,
               COALESCE(SUM(t.amount), 0) AS total_spent
        FROM transactions t
        WHERE t.student_id = %s
    """
    bar_params = [student_id]
    
    if category:
        bar_query += " AND t.category_id = (SELECT id FROM categories WHERE name = %s)"
        bar_params.append(category)
    
    bar_query += " GROUP BY month ORDER BY month DESC LIMIT 6"
    
    bar_data = execute_query(bar_query, tuple(bar_params), fetch_all=True)
    if bar_data is None:
        return jsonify({"error": "Failed to fetch bar chart data"}), 500
    
    # Reverse the bar data to show chronological order (oldest to newest)
    bar_data = list(reversed(bar_data)) if bar_data else []
    
    # Format response
    response = {
        "pie_chart": [
            {
                "name": item['category_name'],
                "value": float(item['total_spent'])
            }
            for item in (pie_data if pie_data else [])
        ],
        "bar_chart": [
            {
                "month": item['month'],
                "value": float(item['total_spent'])
            }
            for item in (bar_data if bar_data else [])
        ],
        "recent_transactions": [
            {
                "id": t['id'],
                "amount": float(t['amount']),
                "merchant_name": t['merchant_name'],
                "category": t['category_name'],
                "payment_date": t['payment_date'].strftime('%Y-%m-%d') if isinstance(t['payment_date'], datetime.date) else t['payment_date'],
                "payment_method": t['payment_method'],
                "notes": t['notes']
            }
            for t in (transactions if transactions else [])
        ]
    }
    
    return jsonify(response)