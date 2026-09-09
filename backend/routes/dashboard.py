from flask import Blueprint, jsonify, request
from database import execute_query
import datetime
from middleware import token_required
from services.financial_reasoning_service import (
    get_student_financial_context,
    generate_spending_insight
)

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/summary', methods=['GET'])
@token_required
def get_dashboard_summary(current_student):
    student_id = current_student['id']
    
    # 1. Fetch full real-data financial context
    context = get_student_financial_context(student_id)
    insight = generate_spending_insight(context)
    
    # 2. Get recent standard transactions (limit 10 for rich activity display)
    recent_transactions_query = """
        SELECT t.id, t.amount, t.merchant_name, t.payment_date, t.payment_method, t.notes,
               c.name AS category_name
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.student_id = %s
        ORDER BY t.payment_date DESC, t.created_at DESC
        LIMIT 10
    """
    recent_transactions = execute_query(recent_transactions_query, (student_id,), fetch_all=True) or []
    for tx in recent_transactions:
        if isinstance(tx.get('payment_date'), (datetime.date, datetime.datetime)):
            tx['payment_date'] = str(tx['payment_date'])

    # 3. Get recent SMS transactions (approved)
    recent_sms_query = """
        SELECT id, amount, transaction_type, merchant, category, status,
               account_last4, transaction_date, created_at
        FROM sms_transactions
        WHERE student_id = %s AND status = 'approved'
        ORDER BY created_at DESC LIMIT 5
    """
    recent_sms = execute_query(recent_sms_query, (student_id,), fetch_all=True) or []
    for tx in recent_sms:
        for field in ('transaction_date', 'created_at'):
            if tx.get(field):
                tx[field] = str(tx[field])

    # 4. Construct response keeping 100% backward compatibility + adding new financial intelligence fields
    response = {
        # Core existing fields
        "total_balance": float(context['available_balance']),
        "available_balance": float(context['available_balance']),
        "total_monthly_spending": float(context['total_monthly_spending']),
        "remaining_budget": float(context['remaining_budget']),
        "total_budget": float(context['total_budget']),
        "budget_utilization_pct": float(context['budget_utilization_pct']),
        
        # Timing & Pacing metrics
        "days_remaining": int(context['days_remaining']),
        "days_passed": int(context['days_passed']),
        "total_days": int(context['total_days']),
        "daily_burn_rate": float(context['daily_burn_rate']),
        "recommended_daily_budget": float(context['recommended_daily_budget']),
        "spend_trend_pct": float(context['spend_trend_pct']),
        "prev_month_spending": float(context['prev_month_spending']),
        
        # Spending Rhythm & Payment Methods
        "spending_rhythm": context['spending_rhythm'],
        "payment_methods": context['payment_methods'],
        
        # Dynamic Deterministic Spending Insight
        "spending_insight": insight,
        
        # SMS bridge fields (preserved)
        "pending_sms_count": int(context['pending_sms_count']),
        "total_income": float(context['total_income']),
        "total_expense": float(context['total_expense']),
        "recent_sms_transactions": recent_sms,
        
        # Transactions & Categories
        "recent_transactions": recent_transactions,
        "category_wise_summary": [
            {
                "category_id": item['category_id'],
                "category": item['category'],
                "spent": float(item['spent']),
                "budget": float(item['budget']),
                "remaining": float(item['remaining']),
                "utilization_pct": float(item['utilization_pct']),
                "is_over_budget": bool(item['is_over_budget'])
            }
            for item in context['category_wise_summary']
        ]
    }

    return jsonify(response)