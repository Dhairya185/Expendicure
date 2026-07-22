from flask import Blueprint, jsonify, request
from database import execute_query
import datetime
from middleware import token_required

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/summary', methods=['GET'])
@token_required
def get_dashboard_summary(current_student):
    student_id = current_student['id']
    
    # Get current month for filtering
    now = datetime.datetime.now()
    current_month = now.strftime('%Y-%m')
    
    # Get student info
    student = current_student
    
    # Get total balance (sum of all transactions? Actually, we don't have income, so balance might be negative of expenses?
    # Since this is a spending tracker, we can show total spending as negative, but let's assume we want to show remaining budget?
    # However, the requirement says: show total balance, total monthly spending, remaining budget.
    # We don't have an income table, so we cannot calculate balance. Let's assume the student sets a total budget and we show remaining.
    # But the requirement also says: "Student can set monthly budget" and it can be category-wise.
    # We don't have a total budget setting, only category-wise.
    # Let's change the approach: 
    #   Total balance: We don't have, so we can set it to 0 or not show. But the requirement says to show.
    #   Alternatively, we can calculate the total spending for the month and compare with the sum of category budgets.
    #   However, the requirement for budget management is category-wise, so we don't have a total budget.
    #   Let's adjust: We'll show:
    #       Total monthly spending: sum of transactions in current month
    #       Remaining budget: For each category, we have a budget. We can show the total remaining across categories?
    #   But the requirement says: "Show remaining budget" (singular). 
    #   Let's re-read: "Student can set monthly budget" and "Budget can be category-wise". 
    #   So the student sets a budget for each category. Then the remaining budget would be per category.
    #   However, the dashboard summary asks for:
    #       - total balance
    #       - total monthly spending
    #       - remaining budget
    #   We don't have a total balance (income) so we cannot compute a remaining total budget.
    #   Let's assume that the total balance is the starting amount (like savings) and we don't track that.
    #   Since the requirement is for a student-focused banking and budget tracking, we might not have income tracking.
    #   We'll adjust the dashboard to show:
    #       total_balance: 0 (or not applicable) - but we have to show something.
    #       total_monthly_spending: sum of transactions in current month
    #       remaining_budget: total budget for the month (sum of category budgets) minus total monthly spending
    #   We'll compute the total budget for the month by summing the monthly_limit for the student in the current month.
    
    # Get total monthly spending for current month
    monthly_spending_query = """
        SELECT COALESCE(SUM(amount), 0) AS total_spent
        FROM transactions
        WHERE student_id = %s AND DATE_FORMAT(payment_date, '%Y-%m') = %s
    """
    monthly_spending_result = execute_query(monthly_spending_query, (student_id, current_month), fetch_one=True)
    total_monthly_spending = monthly_spending_result['total_spent'] if monthly_spending_result else 0
    
    # Get total budget for current month (sum of all category budgets for the student in current month)
    total_budget_query = """
        SELECT COALESCE(SUM(monthly_limit), 0) AS total_budget
        FROM budgets
        WHERE student_id = %s AND month = %s
    """
    total_budget_result = execute_query(total_budget_query, (student_id, current_month), fetch_one=True)
    total_budget = total_budget_result['total_budget'] if total_budget_result else 0
    
    # Remaining budget (if total_budget is set, otherwise 0)
    remaining_budget = total_budget - total_monthly_spending if total_budget > 0 else 0
    
    # For total balance, we don't have an income source, so we'll set it to 0 or maybe we can consider it as the total budget?
    # But the requirement says "total balance", which might be the amount in the bank. Since we don't track that, we'll set to 0.
    total_balance = 0  # Placeholder
    
    # Get recent transactions (limit 5)
    recent_transactions_query = """
        SELECT t.id, t.amount, t.merchant_name, t.payment_date, t.payment_method, t.notes,
               c.name AS category_name
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.student_id = %s
        ORDER BY t.payment_date DESC, t.created_at DESC
        LIMIT 5
    """
    recent_transactions = execute_query(recent_transactions_query, (student_id,), fetch_all=True)
    
    # Get category-wise expense summary for current month
    category_summary_query = """
        SELECT c.name AS category_name, 
               COALESCE(SUM(t.amount), 0) AS spent,
               COALESCE(b.monthly_limit, 0) AS budget
        FROM categories c
        LEFT JOIN transactions t ON c.id = t.category_id AND t.student_id = %s AND DATE_FORMAT(t.payment_date, '%Y-%m') = %s
        LEFT JOIN budgets b ON c.id = b.category_id AND b.student_id = %s AND b.month = %s
        GROUP BY c.id, c.name, b.monthly_limit
        ORDER BY c.name
    """
    category_summary = execute_query(category_summary_query, (student_id, current_month, student_id, current_month), fetch_all=True)
    
    # Format the response
    response = {
        "total_balance": float(total_balance),
        "total_monthly_spending": float(total_monthly_spending),
        "remaining_budget": float(remaining_budget),
        "recent_transactions": recent_transactions if recent_transactions else [],
        "category_wise_summary": [
            {
                "category": item['category_name'],
                "spent": float(item['spent']),
                "budget": float(item['budget']),
                "remaining": float(item['budget'] - item['spent']) if item['budget'] > 0 else 0
            }
            for item in (category_summary if category_summary else [])
        ]
    }
    
    return jsonify(response)