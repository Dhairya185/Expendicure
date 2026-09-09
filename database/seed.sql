-- =============================================================================
-- EXPENDICURE SEED DATA
-- =============================================================================
-- This file is ONLY for local/demo data.
--
-- schema.sql  = database structure
-- seed.sql    = sample data
--
-- Do NOT use this file for production user data.
-- =============================================================================

USE expendicure;


-- =============================================================================
-- 1. SAMPLE STUDENTS
-- =============================================================================

INSERT INTO students
    (student_id, name, email)
VALUES
    ('STU001', 'John Doe', 'john.doe@university.edu'),
    ('STU002', 'Jane Smith', 'jane.smith@university.edu')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    email = VALUES(email);


-- =============================================================================
-- 2. SAMPLE TRANSACTIONS — JOHN DOE
-- =============================================================================

INSERT INTO transactions
    (
        student_id,
        amount,
        merchant_name,
        category_id,
        payment_date,
        payment_method,
        notes
    )
SELECT
    s.id,
    15.50,
    'Campus Cafe',
    c.id,
    '2026-04-01',
    'Credit Card',
    'Lunch with friends'
FROM students s
JOIN categories c ON c.name = 'Food'
WHERE s.student_id = 'STU001'
  AND NOT EXISTS (
      SELECT 1
      FROM transactions t
      WHERE t.student_id = s.id
        AND t.merchant_name = 'Campus Cafe'
        AND t.amount = 15.50
        AND t.payment_date = '2026-04-01'
  );


INSERT INTO transactions
    (
        student_id,
        amount,
        merchant_name,
        category_id,
        payment_date,
        payment_method,
        notes
    )
SELECT
    s.id,
    8.75,
    'Bookstore',
    c.id,
    '2026-04-02',
    'Debit Card',
    'Notebook for class'
FROM students s
JOIN categories c ON c.name = 'Books'
WHERE s.student_id = 'STU001'
  AND NOT EXISTS (
      SELECT 1
      FROM transactions t
      WHERE t.student_id = s.id
        AND t.merchant_name = 'Bookstore'
        AND t.amount = 8.75
        AND t.payment_date = '2026-04-02'
  );


INSERT INTO transactions
    (
        student_id,
        amount,
        merchant_name,
        category_id,
        payment_date,
        payment_method,
        notes
    )
SELECT
    s.id,
    45.00,
    'Gas Station',
    c.id,
    '2026-04-03',
    'Cash',
    'Fuel for car'
FROM students s
JOIN categories c ON c.name = 'Travel'
WHERE s.student_id = 'STU001'
  AND NOT EXISTS (
      SELECT 1
      FROM transactions t
      WHERE t.student_id = s.id
        AND t.merchant_name = 'Gas Station'
        AND t.amount = 45.00
        AND t.payment_date = '2026-04-03'
  );


INSERT INTO transactions
    (
        student_id,
        amount,
        merchant_name,
        category_id,
        payment_date,
        payment_method,
        notes
    )
SELECT
    s.id,
    120.00,
    'Amazon',
    c.id,
    '2026-04-05',
    'Credit Card',
    'New video game'
FROM students s
JOIN categories c ON c.name = 'Entertainment'
WHERE s.student_id = 'STU001'
  AND NOT EXISTS (
      SELECT 1
      FROM transactions t
      WHERE t.student_id = s.id
        AND t.merchant_name = 'Amazon'
        AND t.amount = 120.00
        AND t.payment_date = '2026-04-05'
  );


INSERT INTO transactions
    (
        student_id,
        amount,
        merchant_name,
        category_id,
        payment_date,
        payment_method,
        notes
    )
SELECT
    s.id,
    350.00,
    'Apartment Rent',
    c.id,
    '2026-04-01',
    'Bank Transfer',
    'Monthly rent'
FROM students s
JOIN categories c ON c.name = 'Rent'
WHERE s.student_id = 'STU001'
  AND NOT EXISTS (
      SELECT 1
      FROM transactions t
      WHERE t.student_id = s.id
        AND t.merchant_name = 'Apartment Rent'
        AND t.amount = 350.00
        AND t.payment_date = '2026-04-01'
  );


INSERT INTO transactions
    (
        student_id,
        amount,
        merchant_name,
        category_id,
        payment_date,
        payment_method,
        notes
    )
SELECT
    s.id,
    22.30,
    'Grocery Store',
    c.id,
    '2026-04-04',
    'Debit Card',
    'Weekly groceries'
FROM students s
JOIN categories c ON c.name = 'Rations'
WHERE s.student_id = 'STU001'
  AND NOT EXISTS (
      SELECT 1
      FROM transactions t
      WHERE t.student_id = s.id
        AND t.merchant_name = 'Grocery Store'
        AND t.amount = 22.30
        AND t.payment_date = '2026-04-04'
  );


INSERT INTO transactions
    (
        student_id,
        amount,
        merchant_name,
        category_id,
        payment_date,
        payment_method,
        notes
    )
SELECT
    s.id,
    75.00,
    'Doctor Visit',
    c.id,
    '2026-04-06',
    'Credit Card',
    'Checkup'
FROM students s
JOIN categories c ON c.name = 'Health'
WHERE s.student_id = 'STU001'
  AND NOT EXISTS (
      SELECT 1
      FROM transactions t
      WHERE t.student_id = s.id
        AND t.merchant_name = 'Doctor Visit'
        AND t.amount = 75.00
        AND t.payment_date = '2026-04-06'
  );


INSERT INTO transactions
    (
        student_id,
        amount,
        merchant_name,
        category_id,
        payment_date,
        payment_method,
        notes
    )
SELECT
    s.id,
    12.99,
    'Netflix',
    c.id,
    '2026-04-07',
    'Credit Card',
    'Monthly subscription'
FROM students s
JOIN categories c ON c.name = 'Entertainment'
WHERE s.student_id = 'STU001'
  AND NOT EXISTS (
      SELECT 1
      FROM transactions t
      WHERE t.student_id = s.id
        AND t.merchant_name = 'Netflix'
        AND t.amount = 12.99
        AND t.payment_date = '2026-04-07'
  );


-- =============================================================================
-- 3. SAMPLE TRANSACTIONS — JANE SMITH
-- =============================================================================

INSERT INTO transactions
    (
        student_id,
        amount,
        merchant_name,
        category_id,
        payment_date,
        payment_method,
        notes
    )
SELECT
    s.id,
    9.50,
    'Coffee Shop',
    c.id,
    '2026-04-01',
    'Cash',
    'Morning coffee'
FROM students s
JOIN categories c ON c.name = 'Food'
WHERE s.student_id = 'STU002'
  AND NOT EXISTS (
      SELECT 1
      FROM transactions t
      WHERE t.student_id = s.id
        AND t.merchant_name = 'Coffee Shop'
        AND t.amount = 9.50
        AND t.payment_date = '2026-04-01'
  );


INSERT INTO transactions
    (
        student_id,
        amount,
        merchant_name,
        category_id,
        payment_date,
        payment_method,
        notes
    )
SELECT
    s.id,
    25.00,
    'Textbook Store',
    c.id,
    '2026-04-02',
    'Credit Card',
    'Biology textbook'
FROM students s
JOIN categories c ON c.name = 'Books'
WHERE s.student_id = 'STU002'
  AND NOT EXISTS (
      SELECT 1
      FROM transactions t
      WHERE t.student_id = s.id
        AND t.merchant_name = 'Textbook Store'
        AND t.amount = 25.00
        AND t.payment_date = '2026-04-02'
  );


INSERT INTO transactions
    (
        student_id,
        amount,
        merchant_name,
        category_id,
        payment_date,
        payment_method,
        notes
    )
SELECT
    s.id,
    30.00,
    'Bus Fare',
    c.id,
    '2026-04-03',
    'Cash',
    'Weekly bus pass'
FROM students s
JOIN categories c ON c.name = 'Travel'
WHERE s.student_id = 'STU002'
  AND NOT EXISTS (
      SELECT 1
      FROM transactions t
      WHERE t.student_id = s.id
        AND t.merchant_name = 'Bus Fare'
        AND t.amount = 30.00
        AND t.payment_date = '2026-04-03'
  );


INSERT INTO transactions
    (
        student_id,
        amount,
        merchant_name,
        category_id,
        payment_date,
        payment_method,
        notes
    )
SELECT
    s.id,
    18.75,
    'Restaurant',
    c.id,
    '2026-04-04',
    'Debit Card',
    'Dinner with roommate'
FROM students s
JOIN categories c ON c.name = 'Food'
WHERE s.student_id = 'STU002'
  AND NOT EXISTS (
      SELECT 1
      FROM transactions t
      WHERE t.student_id = s.id
        AND t.merchant_name = 'Restaurant'
        AND t.amount = 18.75
        AND t.payment_date = '2026-04-04'
  );


INSERT INTO transactions
    (
        student_id,
        amount,
        merchant_name,
        category_id,
        payment_date,
        payment_method,
        notes
    )
SELECT
    s.id,
    400.00,
    'Dormitory',
    c.id,
    '2026-04-01',
    'Bank Transfer',
    'Monthly housing'
FROM students s
JOIN categories c ON c.name = 'Rent'
WHERE s.student_id = 'STU002'
  AND NOT EXISTS (
      SELECT 1
      FROM transactions t
      WHERE t.student_id = s.id
        AND t.merchant_name = 'Dormitory'
        AND t.amount = 400.00
        AND t.payment_date = '2026-04-01'
  );


INSERT INTO transactions
    (
        student_id,
        amount,
        merchant_name,
        category_id,
        payment_date,
        payment_method,
        notes
    )
SELECT
    s.id,
    15.20,
    'Pharmacy',
    c.id,
    '2026-04-05',
    'Credit Card',
    'Health purchase'
FROM students s
JOIN categories c ON c.name = 'Health'
WHERE s.student_id = 'STU002'
  AND NOT EXISTS (
      SELECT 1
      FROM transactions t
      WHERE t.student_id = s.id
        AND t.merchant_name = 'Pharmacy'
        AND t.amount = 15.20
        AND t.payment_date = '2026-04-05'
  );


-- =============================================================================
-- 4. SAMPLE BUDGETS — JOHN DOE
-- =============================================================================

INSERT INTO budgets (student_id, category_id, monthly_limit, month)
SELECT s.id, c.id, 200.00, '2026-04'
FROM students s
JOIN categories c ON c.name = 'Food'
WHERE s.student_id = 'STU001'
ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit);


INSERT INTO budgets (student_id, category_id, monthly_limit, month)
SELECT s.id, c.id, 150.00, '2026-04'
FROM students s
JOIN categories c ON c.name = 'Rations'
WHERE s.student_id = 'STU001'
ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit);


INSERT INTO budgets (student_id, category_id, monthly_limit, month)
SELECT s.id, c.id, 100.00, '2026-04'
FROM students s
JOIN categories c ON c.name = 'Travel'
WHERE s.student_id = 'STU001'
ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit);


INSERT INTO budgets (student_id, category_id, monthly_limit, month)
SELECT s.id, c.id, 50.00, '2026-04'
FROM students s
JOIN categories c ON c.name = 'Books'
WHERE s.student_id = 'STU001'
ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit);


INSERT INTO budgets (student_id, category_id, monthly_limit, month)
SELECT s.id, c.id, 400.00, '2026-04'
FROM students s
JOIN categories c ON c.name = 'Rent'
WHERE s.student_id = 'STU001'
ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit);


INSERT INTO budgets (student_id, category_id, monthly_limit, month)
SELECT s.id, c.id, 100.00, '2026-04'
FROM students s
JOIN categories c ON c.name = 'Entertainment'
WHERE s.student_id = 'STU001'
ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit);


INSERT INTO budgets (student_id, category_id, monthly_limit, month)
SELECT s.id, c.id, 75.00, '2026-04'
FROM students s
JOIN categories c ON c.name = 'Health'
WHERE s.student_id = 'STU001'
ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit);


INSERT INTO budgets (student_id, category_id, monthly_limit, month)
SELECT s.id, c.id, 50.00, '2026-04'
FROM students s
JOIN categories c ON c.name = 'Other'
WHERE s.student_id = 'STU001'
ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit);


-- =============================================================================
-- 5. SAMPLE BUDGETS — JANE SMITH
-- =============================================================================

INSERT INTO budgets (student_id, category_id, monthly_limit, month)
SELECT s.id, c.id, 150.00, '2026-04'
FROM students s
JOIN categories c ON c.name = 'Food'
WHERE s.student_id = 'STU002'
ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit);


INSERT INTO budgets (student_id, category_id, monthly_limit, month)
SELECT s.id, c.id, 100.00, '2026-04'
FROM students s
JOIN categories c ON c.name = 'Rations'
WHERE s.student_id = 'STU002'
ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit);


INSERT INTO budgets (student_id, category_id, monthly_limit, month)
SELECT s.id, c.id, 80.00, '2026-04'
FROM students s
JOIN categories c ON c.name = 'Travel'
WHERE s.student_id = 'STU002'
ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit);


INSERT INTO budgets (student_id, category_id, monthly_limit, month)
SELECT s.id, c.id, 75.00, '2026-04'
FROM students s
JOIN categories c ON c.name = 'Books'
WHERE s.student_id = 'STU002'
ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit);


INSERT INTO budgets (student_id, category_id, monthly_limit, month)
SELECT s.id, c.id, 420.00, '2026-04'
FROM students s
JOIN categories c ON c.name = 'Rent'
WHERE s.student_id = 'STU002'
ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit);


INSERT INTO budgets (student_id, category_id, monthly_limit, month)
SELECT s.id, c.id, 75.00, '2026-04'
FROM students s
JOIN categories c ON c.name = 'Entertainment'
WHERE s.student_id = 'STU002'
ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit);


INSERT INTO budgets (student_id, category_id, monthly_limit, month)
SELECT s.id, c.id, 50.00, '2026-04'
FROM students s
JOIN categories c ON c.name = 'Health'
WHERE s.student_id = 'STU002'
ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit);


INSERT INTO budgets (student_id, category_id, monthly_limit, month)
SELECT s.id, c.id, 30.00, '2026-04'
FROM students s
JOIN categories c ON c.name = 'Other'
WHERE s.student_id = 'STU002'
ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit);


-- =============================================================================
-- END OF SEED DATA
-- =============================================================================