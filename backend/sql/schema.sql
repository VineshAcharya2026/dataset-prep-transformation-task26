CREATE DATABASE IF NOT EXISTS dataset_prep CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE dataset_prep;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role ENUM('ADMIN', 'DATA_STEWARD', 'DATA_ANALYST') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS datasets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(50) NOT NULL DEFAULT 'CSV',
  row_count INT NOT NULL DEFAULT 0,
  column_count INT NOT NULL DEFAULT 0,
  status ENUM('PROCESSING', 'PROCESSED', 'FAILED') NOT NULL DEFAULT 'PROCESSING',
  quality_score DECIMAL(5, 2) DEFAULT NULL,
  data_file_path VARCHAR(512) NOT NULL,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_datasets_status (status),
  INDEX idx_datasets_updated_at (updated_at)
);

CREATE TABLE IF NOT EXISTS dataset_versions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dataset_id INT NOT NULL,
  version_number INT NOT NULL,
  version_name VARCHAR(255) NOT NULL,
  description TEXT,
  row_count INT NOT NULL DEFAULT 0,
  column_count INT NOT NULL DEFAULT 0,
  data_file_path VARCHAR(512) NOT NULL,
  created_by INT NOT NULL,
  status ENUM('DRAFT', 'ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  UNIQUE KEY uk_dataset_version (dataset_id, version_number),
  INDEX idx_versions_dataset (dataset_id)
);

CREATE TABLE IF NOT EXISTS transformation_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  transformation_type VARCHAR(64) NOT NULL UNIQUE,
  display_name VARCHAR(128) NOT NULL,
  enabled TINYINT(1) NOT NULL DEFAULT 1,
  allowed_roles JSON NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS transformations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dataset_id INT NOT NULL,
  version_id INT NULL,
  transformation_type VARCHAR(64) NOT NULL,
  column_name VARCHAR(255) NULL,
  configuration JSON NOT NULL,
  execution_order INT NOT NULL DEFAULT 0,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
  FOREIGN KEY (version_id) REFERENCES dataset_versions(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_transformations_dataset (dataset_id, execution_order)
);

CREATE TABLE IF NOT EXISTS transformation_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dataset_id INT NOT NULL,
  version_id INT NULL,
  transformation_id INT NULL,
  transformation_type VARCHAR(64) NOT NULL,
  performed_by INT NOT NULL,
  status ENUM('SUCCESS', 'FAILED', 'PARTIAL') NOT NULL,
  records_affected INT NOT NULL DEFAULT 0,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
  FOREIGN KEY (version_id) REFERENCES dataset_versions(id) ON DELETE SET NULL,
  FOREIGN KEY (transformation_id) REFERENCES transformations(id) ON DELETE SET NULL,
  FOREIGN KEY (performed_by) REFERENCES users(id),
  INDEX idx_history_dataset (dataset_id, executed_at)
);

CREATE TABLE IF NOT EXISTS validation_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dataset_id INT NOT NULL,
  version_id INT NULL,
  total_records INT NOT NULL,
  valid_records INT NOT NULL,
  invalid_records INT NOT NULL,
  null_values INT NOT NULL,
  duplicate_records INT NOT NULL,
  validation_status ENUM('PASSED', 'WARNING', 'FAILED') NOT NULL,
  details JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
  FOREIGN KEY (version_id) REFERENCES dataset_versions(id) ON DELETE SET NULL,
  INDEX idx_validation_dataset (dataset_id)
);
