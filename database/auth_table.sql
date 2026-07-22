-- Migration to add user authentication

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- Seed an initial user for testing (Optional, linking to existing John Doe)
-- Password is 'password123' hashed with bcrypt
-- Note: It's better to let the user register, but we can provide a default.
-- We won't seed here, we will just use the register endpoint.
