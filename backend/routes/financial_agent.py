from flask import Blueprint, jsonify, request
from middleware import token_required
from services.financial_reasoning_service import (
    get_student_financial_context,
    generate_spending_insight,
    evaluate_financial_copilot_query
)

financial_agent_bp = Blueprint('financial_agent', __name__)

@financial_agent_bp.route('/query', methods=['POST'])
@token_required
def query_financial_agent(current_student):
    student_id = current_student['id']
    data = request.get_json() or {}
    question = data.get('question', '').strip()

    if not question:
        return jsonify({"error": "Question is required"}), 400

    try:
        evaluation = evaluate_financial_copilot_query(student_id, question)
        return jsonify({
            "status": "success",
            "question": question,
            "evaluation": evaluation
        })
    except Exception as e:
        print(f"Error evaluating financial query: {e}")
        return jsonify({"error": "Failed to evaluate query", "details": str(e)}), 500

@financial_agent_bp.route('/context', methods=['GET'])
@token_required
def get_financial_context(current_student):
    student_id = current_student['id']
    try:
        context = get_student_financial_context(student_id)
        insight = generate_spending_insight(context)
        return jsonify({
            "status": "success",
            "context": context,
            "insight": insight
        })
    except Exception as e:
        print(f"Error fetching financial context: {e}")
        return jsonify({"error": "Failed to fetch context", "details": str(e)}), 500
