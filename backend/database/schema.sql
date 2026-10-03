CREATE DATABASE IF NOT EXISTS gov_services;
USE gov_services;

-- Users table (both citizens and employees)
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  national_id VARCHAR(20) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  role ENUM('citizen', 'home_affairs', 'traffic', 'finance', 'pension', 'police', 'passport') NOT NULL DEFAULT 'citizen',
  department VARCHAR(50),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Citizen profiles (verified by Home Affairs)
CREATE TABLE IF NOT EXISTS citizen_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date_of_birth DATE,
  gender ENUM('Male', 'Female', 'Other'),
  address TEXT,
  district VARCHAR(50),
  verification_status ENUM('pending', 'verified', 'rejected') DEFAULT 'pending',
  verified_by INT,
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  document_number VARCHAR(50),
  expiry_date DATE,
  file_path VARCHAR(255),
  status ENUM('valid', 'expired', 'pending') DEFAULT 'pending',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Service requests
CREATE TABLE IF NOT EXISTS service_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference_number VARCHAR(20) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  service_type VARCHAR(50) NOT NULL,
  department VARCHAR(50) NOT NULL,
  notes TEXT,
  status ENUM('ready', 'review', 'submitted', 'rejected', 'completed') DEFAULT 'submitted',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Request documents (supporting files)
CREATE TABLE IF NOT EXISTS request_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  file_name VARCHAR(255),
  file_path VARCHAR(255),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Access control (which departments can access what)
CREATE TABLE IF NOT EXISTS access_control (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department VARCHAR(50) NOT NULL,
  can_access_field VARCHAR(50) NOT NULL,
  UNIQUE KEY unique_access (department, can_access_field)
);

-- Seed default access control
INSERT IGNORE INTO access_control (department, can_access_field) VALUES
('traffic', 'full_name'), ('traffic', 'date_of_birth'), ('traffic', 'address'),
('finance', 'full_name'), ('finance', 'national_id'),
('pension', 'full_name'), ('pension', 'date_of_birth'), ('pension', 'address'),
('police', 'full_name'), ('police', 'date_of_birth'),
('passport', 'full_name'), ('passport', 'date_of_birth'), ('passport', 'address');

-- Seed demo employee accounts (password: password123 hashed)
-- Note: Replace with proper bcrypt hashes after running