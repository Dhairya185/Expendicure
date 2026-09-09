-- =============================================================================
-- EXPENDICURE SMS TRANSACTION MIGRATION
-- Used when upgrading an existing database
-- =============================================================================

USE expendicure;


-- =============================================================================
-- WEBHOOK LOGS
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
);


-- =============================================================================
-- SMS TRANSACTIONS
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

    category VARCHAR(100)
        DEFAULT 'Uncategorized',

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
);


-- =============================================================================
-- CATEGORY ENHANCEMENTS
-- =============================================================================

ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS icon VARCHAR(50) DEFAULT 'tag';

ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#6b7280';

ALTER TABLE categories
    ADD COLUMN IF NOT EXISTS is_income BOOLEAN DEFAULT FALSE;