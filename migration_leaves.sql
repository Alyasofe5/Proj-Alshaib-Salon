-- =============================================
-- Migration: Employee Leave Management
-- =============================================

CREATE TABLE IF NOT EXISTS employee_leaves (
    id INT AUTO_INCREMENT PRIMARY KEY,
    salon_id INT NOT NULL,
    employee_id INT NOT NULL,
    leave_date DATE NOT NULL,
    reason VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_leave_date (leave_date),
    INDEX idx_emp_leave (employee_id, leave_date),
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (salon_id) REFERENCES salons(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
