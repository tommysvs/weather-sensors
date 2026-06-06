CREATE DATABASE IF NOT EXISTS openmeteo;
USE openmeteo;

CREATE TABLE IF NOT EXISTS temperature_readings (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  endpoint VARCHAR(128) NOT NULL,
  city VARCHAR(64) NOT NULL,
  requested_latitude DOUBLE NULL,
  requested_longitude DOUBLE NULL,
  latitude DOUBLE NULL,
  longitude DOUBLE NULL,
  temperature DECIMAL(5,2) NOT NULL,
  unit VARCHAR(16) NOT NULL,
  read_at DATETIME NOT NULL,
  timezone VARCHAR(64) NULL,
  source VARCHAR(64) NULL,
  api_instance VARCHAR(32) NOT NULL,
  provider_timestamp DATETIME NULL,
  raw_payload JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_city_readat (city, read_at),
  INDEX idx_api_instance (api_instance)
);