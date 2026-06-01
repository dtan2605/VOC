-- Migration: Add analytics tables used by Phase 6
CREATE TABLE IF NOT EXISTS study_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  word_id INT NOT NULL,
  action VARCHAR(50) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS daily_user_metrics (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(100) NOT NULL,
  metric_date DATE NOT NULL,
  study_sessions INT NOT NULL DEFAULT 0,
  reviewed_count INT NOT NULL DEFAULT 0,
  avg_mastery DECIMAL(5,4) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY ux_user_date (user_id, metric_date)
);
