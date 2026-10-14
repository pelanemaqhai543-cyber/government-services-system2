-- ============================================================
-- Integrated Government Services System
-- Database Schema v2 — with death tracking + auto-verification
-- ============================================================

DROP DATABASE IF EXISTS gov_services;
CREATE DATABASE gov_services;
USE gov_services;

-- ============================================================
-- USERS — citizens and government employees
-- ============================================================
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  national_id VARCHAR(13) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100),
  phone VARCHAR(20),
  role ENUM('citizen', 'home_affairs', 'traffic', 'finance', 'pension', 'police', 'passport') NOT NULL DEFAULT 'citizen',
  department VARCHAR(50),
  is_verified BOOLEAN DEFAULT TRUE,
  status ENUM('active', 'deceased', 'suspended') DEFAULT 'active',
  deceased_at TIMESTAMP NULL,
  deceased_reason TEXT,
  deceased_reported_by INT NULL,
  picture_url VARCHAR(500) NULL,
  picture_locked_until TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_national_id_length CHECK (CHAR_LENGTH(national_id) = 13),
  INDEX idx_status (status),
  INDEX idx_role (role)
);

-- ============================================================
-- CITIZEN PROFILES — government-verified identity
-- ============================================================
CREATE TABLE citizen_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  date_of_birth DATE,
  gender ENUM('Male', 'Female', 'Other'),
  address TEXT,
  district VARCHAR(50),
  verification_status ENUM('auto_verified', 'pending', 'rejected') DEFAULT 'auto_verified',
  verified_by INT NULL,
  verified_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  document_type ENUM('national_id', 'birth_certificate', 'passport', 'drivers_licence', 'marriage_certificate', 'other') NOT NULL,
  document_number VARCHAR(50),
  expiry_date DATE,
  file_path VARCHAR(255),
  status ENUM('valid', 'expired', 'pending', 'cancelled') DEFAULT 'pending',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_docs (user_id, status)
);

-- ============================================================
-- SERVICE REQUESTS
-- ============================================================
CREATE TABLE service_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  reference_number VARCHAR(20) UNIQUE NOT NULL,
  user_id INT NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  department VARCHAR(50) NOT NULL,
  notes TEXT,
  status ENUM('ready', 'review', 'submitted', 'rejected', 'completed', 'cancelled') DEFAULT 'submitted',
  cancellation_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_dept_status (department, status)
);

-- ============================================================
-- REQUEST DOCUMENTS
-- ============================================================
CREATE TABLE request_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  file_name VARCHAR(255),
  file_path VARCHAR(255),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES service_requests(id) ON DELETE CASCADE
);

-- ============================================================
-- NOTIFICATIONS — for citizens
-- ============================================================
CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_notif (user_id, is_read)
);

-- ============================================================
-- NOTIFICATION EVENTS — cross-department alerts (deaths, etc.)
-- ============================================================
CREATE TABLE notification_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event_type ENUM('death', 'id_change', 'address_change', 'document_change', 'other') NOT NULL,
  user_id INT NOT NULL,
  national_id VARCHAR(13) NOT NULL,
  affected_departments VARCHAR(500) NOT NULL,
  payload JSON,
  created_by INT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_event_type (event_type, created_at)
);

-- ============================================================
-- CHANGE LOG — audit trail for citizen data changes
-- ============================================================
CREATE TABLE change_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  field_changed VARCHAR(50) NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_by INT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================================
-- ACCESS CONTROL — department field permissions
-- ============================================================
CREATE TABLE access_control (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department VARCHAR(50) NOT NULL,
  can_access_field VARCHAR(50) NOT NULL,
  UNIQUE KEY unique_access (department, can_access_field)
);

INSERT INTO access_control (department, can_access_field) VALUES
('traffic',  'full_name'), ('traffic',  'date_of_birth'), ('traffic',  'address'),
('finance',  'full_name'), ('finance',  'national_id'),
('pension',  'full_name'), ('pension',  'date_of_birth'), ('pension',  'address'), ('pension', 'status'),
('police',   'full_name'), ('police',   'date_of_birth'),
('passport', 'full_name'), ('passport', 'date_of_birth'), ('passport', 'address');