-- =============================================================================
-- EXPENDICURE COMPLETE DATABASE SCHEMA
-- =============================================================================
-- This file creates the complete Expendicure database from scratch.
-- It includes:
--   1. students
--   2. users
--   3. categories
--   4. transactions
--   5. budgets
--   6. webhook_logs
--   7. sms_transactions
--
-- DO NOT RUN THIS FILE AGAIN IN YOUR CURRENT DATABASE RIGHT NOW.
-- This file is being kept in the project so the database can be recreated
-- later on another machine/cloud MySQL server.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- DATABASE
-- -----------------------------------------------------------------------------

CREATE DATABASE IF NOT EXISTS expendicure
    DEFAULT CHARACTER SET utf8mb4
    DEFAULT COLLATE utf8mb4_unicode_ci;

USE expendicure;


-- =============================================================================
-- 1. STUDENTS
-- =============================================================================

CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_student_email (email),
    INDEX idx_student_code (student_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 2. USERS
-- =============================================================================
-- Stores login/authentication information.
-- password_hash should contain a bcrypt/securely hashed password.
-- =============================================================================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE,

    INDEX idx_username (username)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 3. CATEGORIES
-- =============================================================================

CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    icon VARCHAR(50) DEFAULT 'tag',
    color VARCHAR(7) DEFAULT '#6b7280',
    is_income BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 4. TRANSACTIONS
-- =============================================================================
-- Stores normal/manual transactions and approved transactions.
-- =============================================================================

CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    merchant_name VARCHAR(100) NOT NULL,
    category_id INT NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50) DEFAULT 'UPI',
    notes TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE,

    FOREIGN KEY (category_id)
        REFERENCES categories(id),

    INDEX idx_trans_student_date (student_id, payment_date),
    INDEX idx_trans_category (category_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 5. BUDGETS
-- =============================================================================
-- Monthly budget for each category.
-- month format: YYYY-MM
-- =============================================================================

CREATE TABLE IF NOT EXISTS budgets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    category_id INT NOT NULL,
    monthly_limit DECIMAL(12,2) NOT NULL,
    month VARCHAR(7) NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE,

    FOREIGN KEY (category_id)
        REFERENCES categories(id),

    UNIQUE KEY unique_student_category_month
        (student_id, category_id, month),

    INDEX idx_budget_month (month)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 6. WEBHOOK LOGS
-- =============================================================================
-- Stores incoming bank/SMS notification information for debugging,
-- auditing and duplicate detection.
-- =============================================================================

CREATE TABLE IF NOT EXISTS webhook_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,

    sender VARCHAR(50),

    raw_message TEXT NOT NULL,

    sms_hash VARCHAR(64) NOT NULL,

    is_duplicate BOOLEAN DEFAULT FALSE,

    is_transaction BOOLEAN DEFAULT FALSE,

    parsed_data JSON,

    http_status SMALLINT DEFAULT 200,

    ip_address VARCHAR(45),

    user_agent VARCHAR(255),

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    INDEX idx_sms_hash (sms_hash),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 7. SMS TRANSACTIONS
-- =============================================================================
-- Stores transactions parsed from bank/SMS notifications.
--
-- pending  = waiting for user review
-- approved = confirmed by user
-- ignored  = dismissed by user
-- =============================================================================

CREATE TABLE IF NOT EXISTS sms_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,

    student_id INT NOT NULL,

    amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,

    transaction_type
        ENUM('Expense', 'Income')
        NOT NULL DEFAULT 'Expense',

    merchant VARCHAR(255),

    account_last4 VARCHAR(4),

    category VARCHAR(100) DEFAULT 'Uncategorized',

    status
        ENUM('pending', 'approved', 'ignored')
        NOT NULL DEFAULT 'pending',

    raw_message TEXT NOT NULL,

    sender VARCHAR(50),

    ref_number VARCHAR(100),

    available_balance DECIMAL(12,2),

    transaction_date DATETIME,

    sms_hash VARCHAR(64) UNIQUE NOT NULL,

    webhook_log_id INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (student_id)
        REFERENCES students(id)
        ON DELETE CASCADE,

    FOREIGN KEY (webhook_log_id)
        REFERENCES webhook_logs(id)
        ON DELETE SET NULL,

    INDEX idx_student_status (student_id, status),
    INDEX idx_transaction_date (transaction_date),
    INDEX idx_status (status)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


-- =============================================================================
-- 8. DEFAULT CATEGORIES
-- =============================================================================
-- INSERT IGNORE prevents duplicate category errors if these already exist.
-- =============================================================================

INSERT IGNORE INTO categories
    (name, is_default, icon, color, is_income)
VALUES
    ('Food', TRUE, 'utensils', '#f59e0b', FALSE),

    ('Groceries', TRUE, 'shopping-basket', '#84cc16', FALSE),

    ('Travel', TRUE, 'plane', '#0ea5e9', FALSE),

    ('Shopping', TRUE, 'shopping-cart', '#8b5cf6', FALSE),

    ('Entertainment', TRUE, 'tv', '#ec4899', FALSE),

    ('Healthcare', TRUE, 'heart-pulse', '#ef4444', FALSE),

    ('Education', TRUE, 'graduation-cap', '#14b8a6', FALSE),

    ('Utilities', TRUE, 'zap', '#f97316', FALSE),

    ('Rent', TRUE, 'home', '#6366f1', FALSE),

    ('Cash Withdrawal', TRUE, 'banknote', '#78716c', FALSE),

    ('Transfer', TRUE, 'arrow-right-left', '#64748b', FALSE),

    ('Fuel', TRUE, 'fuel', '#d97706', FALSE),

    ('Investment', TRUE, 'trending-up', '#059669', FALSE),

    ('Salary', TRUE, 'wallet', '#10b981', TRUE),

    ('Refund', TRUE, 'rotate-ccw', '#06b6d4', TRUE),

    ('Income', TRUE, 'plus-circle', '#22c55e', TRUE),

    ('Uncategorized', TRUE, 'help-circle', '#9ca3af', FALSE);


-- =============================================================================
-- END OF SCHEMA
-- =============================================================================