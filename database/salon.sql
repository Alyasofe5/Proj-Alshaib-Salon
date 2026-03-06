SET FOREIGN_KEY_CHECKS=0;
SET NAMES utf8mb4;

DROP TABLE IF EXISTS `transaction_details`;
DROP TABLE IF EXISTS `transactions`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `employees`;
DROP TABLE IF EXISTS `expenses`;
DROP TABLE IF EXISTS `services`;

CREATE TABLE `employees` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `salary_type` enum('fixed','commission') NOT NULL DEFAULT 'commission',
  `base_salary` decimal(10,3) DEFAULT 0.000,
  `commission_rate` decimal(5,2) DEFAULT 0.00,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `expenses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(200) NOT NULL,
  `amount` decimal(10,3) NOT NULL,
  `type` enum('rent','salary','supplies','utilities','other') NOT NULL DEFAULT 'other',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `price` decimal(10,3) NOT NULL DEFAULT 0.000,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `services` (`id`, `name`, `price`, `is_active`, `created_at`) VALUES 
(1, 'حلاقة شعر', 3.000, 1, '2026-02-19 01:09:52'),
(2, 'تشذيب لحية', 1.500, 1, '2026-02-19 01:09:52'),
(3, 'حلاقة + لحية', 4.000, 1, '2026-02-19 01:09:52'),
(4, 'حلاقة أطفال', 2.500, 1, '2026-02-19 01:09:52'),
(5, 'صبغة شعر', 8.000, 1, '2026-02-19 01:09:52'),
(6, 'تنظيف بشرة', 5.000, 1, '2026-02-19 01:09:52'),
(7, 'قص شعر فاشن', 5.000, 1, '2026-02-19 01:09:52');

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` int(11) NOT NULL,
  `total_amount` decimal(10,3) NOT NULL DEFAULT 0.000,
  `payment_method` enum('cash','knet','transfer') NOT NULL DEFAULT 'cash',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `transaction_details` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `transaction_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `price` decimal(10,3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `transaction_id` (`transaction_id`),
  KEY `service_id` (`service_id`),
  CONSTRAINT `transaction_details_ibfk_1` FOREIGN KEY (`transaction_id`) REFERENCES `transactions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `transaction_details_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','employee') NOT NULL DEFAULT 'employee',
  `employee_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `employee_id` (`employee_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `employees` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `users` (`id`, `name`, `username`, `password`, `role`, `employee_id`, `is_active`, `created_at`) VALUES 
(1, 'صاحب المحل', 'admin', '$2y$10$LwtSnR0h/b/1gVdLtUU.He2RuJ5EuS7xh2sINY3TuPV62/C4gQEru', 'admin', NULL, 1, '2026-02-19 01:09:52');

SET FOREIGN_KEY_CHECKS=1;
