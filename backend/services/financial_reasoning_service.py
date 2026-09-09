import datetime
import calendar
import re
from database import execute_query

def get_days_info():
    """Calculate days passed, remaining, and total in the current month."""
    now = datetime.datetime.now()
    _, total_days = calendar.monthrange(now.year, now.month)
    day_today = now.day
    days_passed = max(day_today, 1)
    days_remaining = max(total_days - day_today, 1)
    return total_days, days_passed, days_remaining, now

def get_student_financial_context(student_id):
    """
    Builds a complete, real-data financial context for a student.
    Used for dashboard analytics, insights generation, and Financial Copilot evaluation.
    """
    total_days, days_passed, days_remaining, now = get_days_info()
    current_month = now.strftime('%Y-%m')
    
    # Previous month string (YYYY-MM)
    first_of_current = now.replace(day=1)
    prev_month_date = first_of_current - datetime.timedelta(days=1)
    prev_month = prev_month_date.strftime('%Y-%m')

    # 1. Total monthly spending in current month
    spending_q = """
        SELECT COALESCE(SUM(amount), 0) AS total_spent
        FROM transactions
        WHERE student_id = %s AND DATE_FORMAT(payment_date, '%Y-%m') = %s
    """
    spending_res = execute_query(spending_q, (student_id, current_month), fetch_one=True)
    total_monthly_spending = float(spending_res['total_spent']) if spending_res else 0.0

    # 2. Previous month spending
    prev_spending_q = """
        SELECT COALESCE(SUM(amount), 0) AS prev_spent
        FROM transactions
        WHERE student_id = %s AND DATE_FORMAT(payment_date, '%Y-%m') = %s
    """
    prev_res = execute_query(prev_spending_q, (student_id, prev_month), fetch_one=True)
    prev_month_spending = float(prev_res['prev_spent']) if prev_res else 0.0

    # 3. Total allocated budget for current month
    budget_q = """
        SELECT COALESCE(SUM(monthly_limit), 0) AS total_budget
        FROM budgets
        WHERE student_id = %s AND month = %s
    """
    budget_res = execute_query(budget_q, (student_id, current_month), fetch_one=True)
    total_budget = float(budget_res['total_budget']) if budget_res else 0.0

    # 4. Remaining budget
    remaining_budget = max(0.0, total_budget - total_monthly_spending) if total_budget > 0 else 0.0
    budget_utilization_pct = round((total_monthly_spending / total_budget) * 100, 1) if total_budget > 0 else 0.0

    # 5. Daily burn rate and recommended daily budget
    daily_burn_rate = round(total_monthly_spending / days_passed, 2)
    recommended_daily_budget = round(remaining_budget / days_remaining, 2) if total_budget > 0 else round(daily_burn_rate, 2)
    projected_month_end_spend = round(daily_burn_rate * total_days, 2)

    # 6. Category-wise summary (spent vs budget)
    cat_q = """
        SELECT c.id AS category_id, c.name AS category_name,
               COALESCE(SUM(t.amount), 0) AS spent,
               COALESCE(b.monthly_limit, 0) AS budget
        FROM categories c
        LEFT JOIN transactions t ON c.id = t.category_id AND t.student_id = %s AND DATE_FORMAT(t.payment_date, '%Y-%m') = %s
        LEFT JOIN budgets b ON c.id = b.category_id AND b.student_id = %s AND b.month = %s
        GROUP BY c.id, c.name, b.monthly_limit
        ORDER BY spent DESC
    """
    cat_rows = execute_query(cat_q, (student_id, current_month, student_id, current_month), fetch_all=True) or []
    category_summary = []
    for row in cat_rows:
        spent = float(row['spent'])
        budget = float(row['budget'])
        category_summary.append({
            "category_id": row['category_id'],
            "category": row['category_name'],
            "spent": spent,
            "budget": budget,
            "remaining": max(0.0, budget - spent) if budget > 0 else 0.0,
            "utilization_pct": round((spent / budget) * 100, 1) if budget > 0 else 0.0,
            "is_over_budget": spent > budget if budget > 0 else False
        })

    # 7. SMS statistics (pending count, income, expense)
    pending_sms_q = "SELECT COUNT(*) as pending_count FROM sms_transactions WHERE student_id = %s AND status = 'pending'"
    pending_res = execute_query(pending_sms_q, (student_id,), fetch_one=True)
    pending_sms_count = int(pending_res['pending_count']) if pending_res else 0

    sms_income_q = """
        SELECT COALESCE(SUM(amount), 0) as total FROM sms_transactions
        WHERE student_id = %s AND status = 'approved' AND transaction_type = 'Income'
          AND DATE_FORMAT(COALESCE(transaction_date, created_at), '%Y-%m') = %s
    """
    sms_exp_q = """
        SELECT COALESCE(SUM(amount), 0) as total FROM sms_transactions
        WHERE student_id = %s AND status = 'approved' AND transaction_type = 'Expense'
          AND DATE_FORMAT(COALESCE(transaction_date, created_at), '%Y-%m') = %s
    """
    sms_inc_res = execute_query(sms_income_q, (student_id, current_month), fetch_one=True)
    sms_exp_res = execute_query(sms_exp_q, (student_id, current_month), fetch_one=True)
    total_income = float(sms_inc_res['total']) if sms_inc_res else 0.0
    total_sms_expense = float(sms_exp_res['total']) if sms_exp_res else 0.0

    # 8. Available Balance / Liquid Funds:
    if total_income > 0:
        available_balance = max(0.0, total_income - total_monthly_spending)
    elif total_budget > 0:
        available_balance = remaining_budget
    else:
        available_balance = 0.0

    # 9. Payment method breakdown from real transactions
    methods_q = """
        SELECT COALESCE(NULLIF(payment_method, ''), 'UPI') AS method,
               COUNT(*) AS count,
               COALESCE(SUM(amount), 0) AS total
        FROM transactions
        WHERE student_id = %s AND DATE_FORMAT(payment_date, '%Y-%m') = %s
        GROUP BY method
        ORDER BY total DESC
    """
    method_rows = execute_query(methods_q, (student_id, current_month), fetch_all=True) or []
    payment_methods = [
        {"method": r['method'], "count": int(r['count']), "total": float(r['total'])}
        for r in method_rows
    ]

    # 10. Spending Rhythm data (Past 7 days, Past 30 days, Past 12 months)
    # Past 7 days
    rhythm_7d = []
    for i in range(6, -1, -1):
        day_date = (now - datetime.timedelta(days=i)).strftime('%Y-%m-%d')
        day_label = (now - datetime.timedelta(days=i)).strftime('%a')
        day_q = """
            SELECT COALESCE(SUM(amount), 0) AS day_total
            FROM transactions
            WHERE student_id = %s AND DATE(payment_date) = %s
        """
        day_res = execute_query(day_q, (student_id, day_date), fetch_one=True)
        rhythm_7d.append({
            "date": day_date,
            "label": day_label,
            "amount": float(day_res['day_total']) if day_res else 0.0
        })

    # Past 30 days
    rhythm_30d = []
    for i in range(29, -1, -1):
        d_date = (now - datetime.timedelta(days=i)).strftime('%Y-%m-%d')
        d_label = (now - datetime.timedelta(days=i)).strftime('%d %b')
        d_q = """
            SELECT COALESCE(SUM(amount), 0) AS day_total
            FROM transactions
            WHERE student_id = %s AND DATE(payment_date) = %s
        """
        d_res = execute_query(d_q, (student_id, d_date), fetch_one=True)
        rhythm_30d.append({
            "date": d_date,
            "label": d_label,
            "amount": float(d_res['day_total']) if d_res else 0.0
        })

    # Past 12 months
    rhythm_12m = []
    for i in range(11, -1, -1):
        m_date = (first_of_current - datetime.timedelta(days=i * 28)).replace(day=1)
        m_str = m_date.strftime('%Y-%m')
        m_label = m_date.strftime('%b %y')
        m_q = """
            SELECT COALESCE(SUM(amount), 0) AS m_total
            FROM transactions
            WHERE student_id = %s AND DATE_FORMAT(payment_date, '%Y-%m') = %s
        """
        m_res = execute_query(m_q, (student_id, m_str), fetch_one=True)
        rhythm_12m.append({
            "month": m_str,
            "label": m_label,
            "amount": float(m_res['m_total']) if m_res else 0.0
        })

    # Period-over-period spend trend percentage
    spend_trend_pct = 0.0
    if prev_month_spending > 0:
        spend_trend_pct = round(((total_monthly_spending - prev_month_spending) / prev_month_spending) * 100, 1)

    return {
        "current_month": current_month,
        "total_days": total_days,
        "days_passed": days_passed,
        "days_remaining": days_remaining,
        "total_balance": available_balance,
        "available_balance": available_balance,
        "total_monthly_spending": total_monthly_spending,
        "prev_month_spending": prev_month_spending,
        "spend_trend_pct": spend_trend_pct,
        "total_budget": total_budget,
        "remaining_budget": remaining_budget,
        "budget_utilization_pct": budget_utilization_pct,
        "daily_burn_rate": daily_burn_rate,
        "recommended_daily_budget": recommended_daily_budget,
        "projected_month_end_spend": projected_month_end_spend,
        "category_wise_summary": category_summary,
        "pending_sms_count": pending_sms_count,
        "total_income": total_income,
        "total_expense": total_sms_expense,
        "payment_methods": payment_methods,
        "spending_rhythm": {
            "week": rhythm_7d,
            "month": rhythm_30d,
            "year": rhythm_12m
        }
    }

def generate_spending_insight(context):
    """
    Generates deterministic, mathematically sound spending insights based on actual user data.
    """
    cats = context.get('category_wise_summary', [])
    active_cats = [c for c in cats if c['spent'] > 0]
    days_remaining = context.get('days_remaining', 1)
    daily_burn = context.get('daily_burn_rate', 0.0)
    rec_daily = context.get('recommended_daily_budget', 0.0)
    total_budget = context.get('total_budget', 0.0)
    remaining_budget = context.get('remaining_budget', 0.0)

    # If no spending yet
    if not active_cats:
        return {
            "category": "All Spending",
            "title": "Clean Slate This Month",
            "message": f"You have ₹{remaining_budget:,.2f} budget allocated across {days_remaining} days remaining. Keep transactions logged to monitor pacing.",
            "subtext": f"Recommended daily ceiling: ₹{rec_daily:,.2f}/day.",
            "severity": "normal",
            "action_text": "Set Budgets",
            "action_link": "/budget"
        }

    # Find highest spend category
    top_cat = active_cats[0]
    cat_name = top_cat['category']
    cat_spent = top_cat['spent']
    cat_budget = top_cat['budget']
    cat_remaining = top_cat['remaining']

    # Case 1: Category is over budget
    if top_cat.get('is_over_budget'):
        over_by = cat_spent - cat_budget
        return {
            "category": cat_name,
            "title": f"Budget Exceeded in {cat_name}",
            "message": f"You've exceeded your {cat_name} budget by ₹{over_by:,.2f} ({top_cat['utilization_pct']}% used). Consider trimming non-essential expenses for the remaining {days_remaining} days.",
            "subtext": f"Current pace: ₹{daily_burn:,.2f}/day. Recommended buffer: ₹{rec_daily:,.2f}/day.",
            "severity": "alert",
            "action_text": "Adjust Budget",
            "action_link": "/budget"
        }

    # Case 2: Category is nearing limit (>80%)
    if top_cat['utilization_pct'] >= 80:
        return {
            "category": cat_name,
            "title": f"High Velocity in {cat_name}",
            "message": f"{cat_name} spending is at {top_cat['utilization_pct']}% of its ₹{cat_budget:,.2f} limit with ₹{cat_remaining:,.2f} left for {days_remaining} days.",
            "subtext": f"At your current pace, you have approximately ₹{(cat_remaining/max(days_remaining,1)):,.2f}/day remaining for {cat_name}.",
            "severity": "warning",
            "action_text": "View Category",
            "action_link": "/categories"
        }

    # Case 3: Overall spending pace warning
    if total_budget > 0 and context.get('projected_month_end_spend', 0) > total_budget:
        projected = context['projected_month_end_spend']
        excess = projected - total_budget
        return {
            "category": cat_name,
            "title": "Pacing Warning",
            "message": f"At your current spending pace of ₹{daily_burn:,.2f}/day, your projected month-end spend is ₹{projected:,.2f}, which exceeds your budget by ₹{excess:,.2f}.",
            "subtext": f"Lowering your daily burn to ₹{rec_daily:,.2f}/day will keep you comfortably on track.",
            "severity": "warning",
            "action_text": "View Analytics",
            "action_link": "/analytics"
        }

    # Case 4: Healthy spending
    return {
        "category": cat_name,
        "title": f"Healthy Pace in {cat_name}",
        "message": f"{cat_name} accounts for the largest portion of your spend (₹{cat_spent:,.2f}). You are comfortably pacing with ₹{remaining_budget:,.2f} remaining overall.",
        "subtext": f"Safe daily spending allowance: ₹{rec_daily:,.2f}/day for the next {days_remaining} days.",
        "severity": "normal",
        "action_text": "View Insights",
        "action_link": "/analytics"
    }

def evaluate_financial_copilot_query(student_id, question):
    """
    Evaluates a natural question from the student using real mathematical financial reasoning.
    Returns a structured recommendation (AFFORD, OPTIMIZE, POSTPONE, PLAN, EXPLORE).
    """
    context = get_student_financial_context(student_id)
    q_lower = question.lower().strip()

    # Extract numerical amount if mentioned (e.g. ₹10,000, 10000, 500)
    amount_matches = re.findall(r'(?:₹|rs\.?|inr)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]{1,2})?)', q_lower)
    clean_amounts = []
    for m in amount_matches:
        try:
            val = float(m.replace(',', ''))
            if val > 0:
                clean_amounts.append(val)
        except ValueError:
            pass

    target_amount = max(clean_amounts) if clean_amounts else None

    avail_balance = context['available_balance']
    rem_budget = context['remaining_budget']
    days_rem = context['days_remaining']
    rec_daily = context['recommended_daily_budget']
    daily_burn = context['daily_burn_rate']
    total_budget = context['total_budget']

    # Scenario A: Specific purchase or trip affordability
    if target_amount is not None and ("afford" in q_lower or "trip" in q_lower or "buy" in q_lower or "spend" in q_lower or "cost" in q_lower or "goa" in q_lower or "laptop" in q_lower):
        buffer_after = rem_budget - target_amount
        daily_after = buffer_after / max(days_rem, 1)

        if buffer_after >= 0 and daily_after >= (rec_daily * 0.4):
            return {
                "verdict": "AFFORD",
                "badge_class": "badge-success",
                "headline": f"You can comfortably accommodate this ₹{target_amount:,.2f} purchase.",
                "explanation": (
                    f"Your remaining monthly budget is ₹{rem_budget:,.2f}. After this expense, you will still have "
                    f"₹{buffer_after:,.2f} buffer across the remaining {days_rem} days (₹{daily_after:,.2f}/day allowance)."
                ),
                "budget_impact": {
                    "purchase_amount": target_amount,
                    "budget_before": rem_budget,
                    "budget_after": buffer_after,
                    "daily_allowance_after": round(daily_after, 2),
                    "days_remaining": days_rem
                },
                "recommendations": [
                    "Log the expense under the appropriate category once completed.",
                    f"Maintain a daily spending ceiling of ₹{daily_after:,.2f} for remaining routine expenses."
                ]
            }
        elif buffer_after >= 0 and daily_after < (rec_daily * 0.4):
            suggested_target = max(500, target_amount * 0.75)
            return {
                "verdict": "OPTIMIZE",
                "badge_class": "badge-warning",
                "headline": f"Affordable, but it significantly compresses your daily safety buffer.",
                "explanation": (
                    f"Paying ₹{target_amount:,.2f} leaves only ₹{buffer_after:,.2f} for the remaining {days_rem} days "
                    f"(dropping your daily budget to just ₹{daily_after:,.2f}/day)."
                ),
                "budget_impact": {
                    "purchase_amount": target_amount,
                    "budget_before": rem_budget,
                    "budget_after": buffer_after,
                    "daily_allowance_after": round(daily_after, 2),
                    "days_remaining": days_rem
                },
                "recommendations": [
                    f"Explore optimizing this cost down to ~₹{suggested_target:,.2f} to protect your daily liquidity.",
                    f"If making this purchase, defer non-essential dining/entertainment expenses for {days_rem} days."
                ]
            }
        else:
            deficit = abs(buffer_after)
            weeks_needed = max(2, int(deficit / (max(daily_burn, 500) * 4)) + 1)
            weekly_savings = round(target_amount / weeks_needed, 2)
            return {
                "verdict": "POSTPONE",
                "badge_class": "badge-error",
                "headline": f"This expense would exceed your remaining monthly budget by ₹{deficit:,.2f}.",
                "explanation": (
                    f"Your remaining budget for this month is ₹{rem_budget:,.2f}. Committing ₹{target_amount:,.2f} now "
                    f"would create a budget overrun and risk month-end essentials."
                ),
                "budget_impact": {
                    "purchase_amount": target_amount,
                    "budget_before": rem_budget,
                    "budget_deficit": deficit,
                    "days_remaining": days_rem
                },
                "recommendations": [
                    "Postpone this purchase to next month or split it into milestones.",
                    f"Suggested plan: Save ₹{weekly_savings:,.2f}/week for {weeks_needed} weeks to fund this guilt-free."
                ]
            }

    # Scenario B: Weekend / Short-term spending inquiry
    if "weekend" in q_lower or "saturday" in q_lower or "sunday" in q_lower:
        weekend_safe_limit = round(rec_daily * 2 * 1.25, 2)
        if rem_budget <= 0:
            weekend_safe_limit = round(max(0, avail_balance * 0.1), 2)
        return {
            "verdict": "PLAN",
            "badge_class": "badge-primary",
            "headline": f"Recommended weekend budget ceiling: ₹{weekend_safe_limit:,.2f}",
            "explanation": (
                f"With {days_rem} days left and ₹{rem_budget:,.2f} in your active budget, your baseline safe daily burn "
                f"is ₹{rec_daily:,.2f}. Allocating up to ₹{weekend_safe_limit:,.2f} across the weekend keeps you on track."
            ),
            "budget_impact": {
                "safe_weekend_limit": weekend_safe_limit,
                "current_daily_baseline": rec_daily,
                "remaining_budget": rem_budget
            },
            "recommendations": [
                f"Allocate up to ₹{weekend_safe_limit/2:,.2f} on Saturday and ₹{weekend_safe_limit/2:,.2f} on Sunday.",
                "Use UPI or Debit Card with instant logging to prevent unaccounted leakage."
            ]
        }

    # Scenario C: Postponing Advice
    if "postpone" in q_lower or "wait" in q_lower or "delay" in q_lower:
        if days_rem <= 7 and rem_budget < (total_budget * 0.25):
            return {
                "verdict": "POSTPONE",
                "badge_class": "badge-warning",
                "headline": "Yes, postponing until the 1st of next month is strongly advised.",
                "explanation": (
                    f"Only {days_rem} days remain in the current billing cycle and remaining budget is down to "
                    f"₹{rem_budget:,.2f}. Deferring non-urgent purchases resets your limit cleanly without penalty."
                ),
                "recommendations": [
                    f"Wait {days_rem} days for the new monthly budget cycle.",
                    "Add this item to next month's prioritized category budget."
                ]
            }
        else:
            return {
                "verdict": "OPTIMIZE",
                "badge_class": "badge-success",
                "headline": "You have sufficient buffer, but assess if the purchase is time-sensitive.",
                "explanation": f"You currently have ₹{rem_budget:,.2f} in remaining budget (₹{rec_daily:,.2f}/day). Proceed if it's essential, or hold for promotions.",
                "recommendations": [
                    "Check if cashbacks or student discounts apply before purchasing."
                ]
            }

    # Scenario D: Savings rate guidance
    if "save" in q_lower or "savings" in q_lower or "invest" in q_lower:
        target_monthly_savings = max(1000.0, total_budget * 0.2) if total_budget > 0 else 2000.0
        weekly_save = round(target_monthly_savings / 4, 2)
        return {
            "verdict": "PLAN",
            "badge_class": "badge-primary",
            "headline": f"Aim to save ₹{weekly_save:,.2f} per week (₹{target_monthly_savings:,.2f}/month).",
            "explanation": (
                f"Following the 50/30/20 student budgeting rule on your ₹{total_budget:,.2f} baseline, saving a 20% "
                f"buffer builds a reserve for unexpected academic or travel costs."
            ),
            "recommendations": [
                f"Set aside ₹{weekly_save:,.2f} every Monday right after allowances/transfers.",
                f"Keep routine category expenses within ₹{rec_daily:,.2f}/day."
            ]
        }

    # Scenario E: General Financial Health Check / Fallback
    status_verdict = "AFFORD" if context['budget_utilization_pct'] < 75 else ("OPTIMIZE" if context['budget_utilization_pct'] < 100 else "POSTPONE")
    return {
        "verdict": status_verdict,
        "badge_class": "badge-success" if status_verdict == "AFFORD" else ("badge-warning" if status_verdict == "OPTIMIZE" else "badge-error"),
        "headline": f"Financial Snapshot: ₹{rem_budget:,.2f} remaining across {days_rem} days.",
        "explanation": (
            f"You have spent ₹{context['total_monthly_spending']:,.2f} out of your ₹{total_budget:,.2f} budget "
            f"({context['budget_utilization_pct']}%). Your safe spending rate is ₹{rec_daily:,.2f} per day."
        ),
        "budget_impact": {
            "total_budget": total_budget,
            "total_spent": context['total_monthly_spending'],
            "remaining_budget": rem_budget,
            "daily_allowance": rec_daily,
            "days_remaining": days_rem
        },
        "recommendations": [
            "Try asking specific questions like 'Can I afford a ₹5,000 trip?' or 'How much can I spend this weekend?'",
            "Keep logging your UPI and cash transactions to maintain real-time precision."
        ]
    }
