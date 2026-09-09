"""
routes/sms_transactions.py
============================================================
New blueprint for SMS transaction management.

Endpoints:
  GET    /api/sms-transactions/pending          — list pending SMS transactions
  GET    /api/sms-transactions/                 — list all (approved + pending)
  PUT    /api/sms-transactions/<id>             — edit amount/merchant/category
  PUT    /api/sms-transactions/<id>/approve     — approve (with optional edits)
  DELETE /api/sms-transactions/<id>             — delete/ignore
  GET    /api/sms-transactions/stats            — summary stats for dashboard
============================================================
"""

from flask import Blueprint, jsonify, request
from database import execute_query
from middleware import token_required

sms_transactions_bp = Blueprint('sms_transactions', __name__)


# ─── GET /api/sms-transactions/pending ──────────────────────────────────────────
@sms_transactions_bp.route('/pending', methods=['GET'])
@token_required
def get_pending(current_student):
    """Return all pending SMS transactions for the current student."""
    student_id = current_student['id']

    query = """
        SELECT id, amount, transaction_type, merchant, account_last4,
               category, status, raw_message, sender, ref_number,
               available_balance, transaction_date, created_at
        FROM sms_transactions
        WHERE student_id = %s AND status = 'pending'
        ORDER BY created_at DESC
    """
    transactions = execute_query(query, (student_id,), fetch_all=True)
    if transactions is None:
        return jsonify({'error': 'Failed to fetch pending transactions'}), 500

    # Convert datetime objects to ISO strings for JSON serialisation
    for t in transactions:
        if t.get('transaction_date'):
            t['transaction_date'] = str(t['transaction_date'])
        if t.get('created_at'):
            t['created_at'] = str(t['created_at'])

    return jsonify(transactions)


# ─── GET /api/sms-transactions/ ─────────────────────────────────────────────────
@sms_transactions_bp.route('/', methods=['GET'], strict_slashes=False)
@token_required
def get_all(current_student):
    """Return all SMS transactions (any status) for the current student."""
    student_id = current_student['id']
    status_filter = request.args.get('status')  # optional ?status=approved

    if status_filter:
        query = """
            SELECT * FROM sms_transactions
            WHERE student_id = %s AND status = %s
            ORDER BY created_at DESC
        """
        transactions = execute_query(query, (student_id, status_filter), fetch_all=True)
    else:
        query = """
            SELECT * FROM sms_transactions
            WHERE student_id = %s
            ORDER BY created_at DESC
        """
        transactions = execute_query(query, (student_id,), fetch_all=True)

    if transactions is None:
        return jsonify({'error': 'Failed to fetch SMS transactions'}), 500

    for t in transactions:
        if t.get('transaction_date'):
            t['transaction_date'] = str(t['transaction_date'])
        if t.get('created_at'):
            t['created_at'] = str(t['created_at'])
        if t.get('updated_at'):
            t['updated_at'] = str(t['updated_at'])

    return jsonify(transactions)


# ─── PUT /api/sms-transactions/<id> ─────────────────────────────────────────────
@sms_transactions_bp.route('/<int:tx_id>', methods=['PUT'])
@token_required
def update_transaction(current_student, tx_id):
    """Edit amount, merchant, or category of a pending SMS transaction."""
    student_id = current_student['id']
    data = request.get_json()

    if not data:
        return jsonify({'error': 'Request body is required'}), 400

    # Verify ownership
    check = execute_query(
        "SELECT id, status FROM sms_transactions WHERE id = %s AND student_id = %s",
        (tx_id, student_id),
        fetch_one=True
    )
    if not check:
        return jsonify({'error': 'Transaction not found or unauthorized'}), 404
    if check['status'] == 'approved':
        return jsonify({'error': 'Cannot edit an already-approved transaction'}), 409

    # Build dynamic UPDATE
    allowed = ['amount', 'merchant', 'category']
    updates = {k: v for k, v in data.items() if k in allowed}

    if not updates:
        return jsonify({'error': f'No valid fields to update. Allowed: {allowed}'}), 400

    set_clause = ', '.join(f"{k} = %s" for k in updates.keys())
    values = list(updates.values()) + [tx_id, student_id]

    result = execute_query(
        f"UPDATE sms_transactions SET {set_clause} WHERE id = %s AND student_id = %s",
        values,
        commit=True
    )
    if result is None:
        return jsonify({'error': 'Failed to update transaction'}), 500

    # Return updated record
    updated = execute_query(
        """SELECT id, amount, transaction_type, merchant, account_last4,
                  category, status, raw_message, sender, created_at
           FROM sms_transactions WHERE id = %s""",
        (tx_id,),
        fetch_one=True
    )
    if updated and updated.get('created_at'):
        updated['created_at'] = str(updated['created_at'])

    return jsonify(updated)


# ─── PUT /api/sms-transactions/<id>/approve ─────────────────────────────────────
@sms_transactions_bp.route('/<int:tx_id>/approve', methods=['PUT'])
@token_required
def approve_transaction(current_student, tx_id):
    """
    Approve a pending SMS transaction.
    Optionally accepts final edits in the request body before approving.
    """
    student_id = current_student['id']
    data = request.get_json() or {}

    # Verify ownership and pending status
    check = execute_query(
        "SELECT id, status FROM sms_transactions WHERE id = %s AND student_id = %s",
        (tx_id, student_id),
        fetch_one=True
    )
    if not check:
        return jsonify({'error': 'Transaction not found or unauthorized'}), 404
    if check['status'] != 'pending':
        return jsonify({'error': f"Transaction is already '{check['status']}'"}), 409

    # Apply optional field edits before approve
    allowed = ['amount', 'merchant', 'category']
    updates = {k: v for k, v in data.items() if k in allowed}

    if updates:
        set_clause = ', '.join(f"{k} = %s" for k in updates.keys())
        values = list(updates.values()) + [tx_id, student_id]
        execute_query(
            f"UPDATE sms_transactions SET {set_clause} WHERE id = %s AND student_id = %s",
            values,
            commit=True
        )

    # Set status to approved
    result = execute_query(
        "UPDATE sms_transactions SET status = 'approved' WHERE id = %s AND student_id = %s",
        (tx_id, student_id),
        commit=True
    )
    if result is None:
        return jsonify({'error': 'Failed to approve transaction'}), 500

    # Fetch final approved transaction
    approved = execute_query(
        """SELECT id, amount, transaction_type, merchant, account_last4,
                  category, status, raw_message, sender, transaction_date, created_at
           FROM sms_transactions WHERE id = %s""",
        (tx_id,),
        fetch_one=True
    )
    if approved:
        for field in ('transaction_date', 'created_at'):
            if approved.get(field):
                approved[field] = str(approved[field])

    return jsonify({
        'message': 'Transaction approved successfully',
        'transaction': approved
    })


# ─── DELETE /api/sms-transactions/<id> ──────────────────────────────────────────
@sms_transactions_bp.route('/<int:tx_id>', methods=['DELETE'])
@token_required
def delete_transaction(current_student, tx_id):
    """Delete / ignore a pending SMS transaction."""
    student_id = current_student['id']

    check = execute_query(
        "SELECT id FROM sms_transactions WHERE id = %s AND student_id = %s",
        (tx_id, student_id),
        fetch_one=True
    )
    if not check:
        return jsonify({'error': 'Transaction not found or unauthorized'}), 404

    result = execute_query(
        "DELETE FROM sms_transactions WHERE id = %s AND student_id = %s",
        (tx_id, student_id),
        commit=True
    )
    if result is None:
        return jsonify({'error': 'Failed to delete transaction'}), 500

    return jsonify({'message': 'Transaction deleted successfully'})


# ─── GET /api/sms-transactions/stats ────────────────────────────────────────────
@sms_transactions_bp.route('/stats', methods=['GET'])
@token_required
def get_stats(current_student):
    """
    Summary stats for the dashboard widget.
    Returns: pending_count, approved_count, total_income, total_expense
    """
    student_id = current_student['id']

    pending_count = execute_query(
        "SELECT COUNT(*) as count FROM sms_transactions WHERE student_id = %s AND status = 'pending'",
        (student_id,),
        fetch_one=True
    )
    approved_count = execute_query(
        "SELECT COUNT(*) as count FROM sms_transactions WHERE student_id = %s AND status = 'approved'",
        (student_id,),
        fetch_one=True
    )
    income = execute_query(
        """SELECT COALESCE(SUM(amount), 0) as total
           FROM sms_transactions
           WHERE student_id = %s AND status = 'approved' AND transaction_type = 'Income'""",
        (student_id,),
        fetch_one=True
    )
    expense = execute_query(
        """SELECT COALESCE(SUM(amount), 0) as total
           FROM sms_transactions
           WHERE student_id = %s AND status = 'approved' AND transaction_type = 'Expense'""",
        (student_id,),
        fetch_one=True
    )

    return jsonify({
        'pending_count':  pending_count['count']   if pending_count  else 0,
        'approved_count': approved_count['count']  if approved_count else 0,
        'total_income':   float(income['total'])   if income         else 0,
        'total_expense':  float(expense['total'])  if expense        else 0,
    })
