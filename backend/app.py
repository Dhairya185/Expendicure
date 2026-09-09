from flask import Flask, jsonify, request
from flask_cors import CORS
from config import Config
from database import get_db_connection, close_request_connection
app = Flask(__name__)

# Return the per-request shared DB connection to the pool at end of each request
app.teardown_appcontext(close_request_connection)
CORS(app)  # Enable CORS for all routes

# Import routes
from routes.auth import auth_bp
from routes.students import students_bp
from routes.transactions import transactions_bp
from routes.categories import categories_bp
from routes.budgets import budgets_bp
from routes.dashboard import dashboard_bp
from routes.reports import reports_bp
from routes.sms_transactions import sms_transactions_bp
from routes.financial_agent import financial_agent_bp

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(students_bp, url_prefix='/api/students')
app.register_blueprint(transactions_bp, url_prefix='/api/transactions')
app.register_blueprint(categories_bp, url_prefix='/api/categories')
app.register_blueprint(budgets_bp, url_prefix='/api/budgets')
app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
app.register_blueprint(reports_bp, url_prefix='/api/reports')
app.register_blueprint(sms_transactions_bp, url_prefix='/api/sms-transactions')
app.register_blueprint(financial_agent_bp, url_prefix='/api/financial-agent')

@app.route('/')
def home():
    return jsonify({"message": "Welcome to Expendicure API"})

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Not found"}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500

if __name__ == '__main__':
    app.run(debug=Config.DEBUG, port=5000)