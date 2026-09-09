-- =============================================================================
-- EXPENDICURE AUTHENTICATION MIGRATION
-- Used when upgrading an older Expendicure database
-- =============================================================================

USE expendicure;

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
);