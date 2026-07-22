# Expendicure - Student Banking & Budget Tracking Application

Expendicure is a student-focused banking and budget tracking web application that allows college students to record payments, categorize expenses, set monthly budgets, and view spending analytics through graphs.

## Features

### 1. Student Dashboard
- Shows total balance
- Displays total monthly spending
- Shows remaining budget
- Lists recent transactions
- Provides category-wise expense summary

### 2. Payment / Transaction System
- Add payment transactions with fields:
  - Amount
  - Merchant name
  - Category (selectable)
  - Payment date
  - Payment method
  - Notes
- Update transaction category after creation

### 3. Expense Categories
- Default categories: Food, Rations, Travel, Books, Rent, Entertainment, Health, Other
- Ability to add new categories

### 4. Budget Management
- Set monthly budget (category-wise)
- View remaining budget
- Warning when spending crosses category budget

### 5. Graphs and Reports
- Pie chart for category-wise spending
- Bar chart for monthly spending
- Recent transactions table
- Filter transactions by category and date

## Technology Stack

- **Frontend**: React with Vite
- **Backend**: Python Flask
- **Database**: MySQL
- **Styling**: Clean white modern UI using CSS
- **Charts**: Recharts
- **API Communication**: REST API using Axios

## Database Schema

The application uses four main tables:

### Students
- `id` (INT, PK, Auto Increment)
- `student_id` (VARCHAR, Unique)
- `name` (VARCHAR)
- `email` (VARCHAR, Unique)
- `created_at` (TIMESTAMP)

### Categories
- `id` (INT, PK, Auto Increment)
- `name` (VARCHAR, Unique)
- `is_default` (BOOLEAN)
- `created_at` (TIMESTAMP)

### Transactions
- `id` (INT, PK, Auto Increment)
- `student_id` (INT, FK to Students)
- `amount` (DECIMAL)
- `merchant_name` (VARCHAR)
- `category_id` (INT, FK to Categories)
- `payment_date` (DATE)
- `payment_method` (VARCHAR)
- `notes` (TEXT)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Budgets
- `id` (INT, PK, Auto Increment)
- `student_id` (INT, FK to Students)
- `category_id` (INT, FK to Categories)
- `monthly_limit` (DECIMAL)
- `month` (VARCHAR, Format: YYYY-MM)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- Python (v3.8+)
- MySQL Server

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd expendicure/backend
   ```

2. Create a virtual environment and activate it:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the backend directory with the following content:
   ```
   MYSQL_HOST=localhost
   MYSQL_USER=root
   MYSQL_PASSWORD=your_mysql_password
   MYSQL_DB=expendicure
   MYSQL_PORT=3306
   SECRET_KEY=your_secret_key
   FLASK_DEBUG=True
   ```

5. Create the database and import schema:
   ```bash
   # Login to MySQL
   mysql -u root -p
   
   # In MySQL prompt:
   CREATE DATABASE expendicure;
   USE expendicure;
   SOURCE database/schema.sql;
   SOURCE database/seed.sql;
   EXIT;
   ```

6. Start the Flask server:
   ```bash
   python app.py
   ```
   The backend will run on http://localhost:5000

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd expendicure/frontend
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will run on http://localhost:3000

## API Endpoints

### Students
- GET `/api/students/` - Get all students
- GET `/api/students/<id>` - Get specific student

### Transactions
- GET `/api/transactions?student_id=<id>` - Get transactions for a student
- POST `/api/transactions/` - Add new transaction
- PUT `/api/transactions/<id>` - Update transaction category
- DELETE `/api/transactions/<id>` - Delete transaction

### Categories
- GET `/api/categories/` - Get all categories
- POST `/api/categories/` - Add new category
- PUT `/api/categories/<id>` - Update category
- DELETE `/api/categories/<id>` - Delete category

### Budgets
- GET `/api/budgets?student_id=<id>&month=<YYYY-MM>` - Get budgets for student
- POST `/api/budgets/` - Add or update budget

### Dashboard
- GET `/api/dashboard/summary/<student_id>` - Get dashboard summary

### Reports
- GET `/api/reports/chart-data/<student_id>?<filters>` - Get chart data and filtered transactions

## Sample SQL Commands to Verify Data Connection

After setting up the database, you can run these commands to verify the connection:

```sql
-- Check students
SELECT * FROM students;

-- Check categories
SELECT * FROM categories;

-- Check transactions for student 1
SELECT t.*, c.name AS category_name 
FROM transactions t 
JOIN categories c ON t.category_id = c.id 
WHERE t.student_id = 1;

-- Check budgets for student 1 in April 2026
SELECT b.*, c.name AS category_name 
FROM budgets b 
JOIN categories c ON b.category_id = c.id 
WHERE b.student_id = 1 AND b.month = '2026-04';
```

## Project Structure

```
expendicure/
├── backend/
│   ├── app.py
│   ├── config.py
│   ├── database.py
│   ├── requirements.txt
│   ├── routes/
│   │   ├── students.py
│   │   ├── transactions.py
│   │   ├── categories.py
│   │   ├── budgets.py
│   │   ├── dashboard.py
│   │   └── reports.py
│   └── models/
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── src/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── api/
│   │   │   └── api.js
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   └── ui/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Transactions.jsx
│   │   │   ├── AddTransaction.jsx
│   │   │   ├── Budget.jsx
│   │   │   ├── Reports.jsx
│   │   │   └── CategoryManager.jsx
│   │   └── styles/
│   │       └── index.css
├── database/
│   ├── schema.sql
│   └── seed.sql
└── README.md
```

## Screenshots Placeholder

For academic report purposes, include screenshots of:
1. Login/Student selection screen
2. Dashboard with statistics and charts
3. Transactions list
4. Add transaction form
5. Budget management page
6. Reports/analytics page
7. Category management page

## Notes for Academic Submission

- All data is stored in MySQL and retrieved through Flask REST APIs
- The application demonstrates full-stack development with React frontend and Python backend
- Proper error handling and validation are implemented
- The UI uses a clean, modern design suitable for college project presentation
- Sample data is provided for immediate testing and demonstration