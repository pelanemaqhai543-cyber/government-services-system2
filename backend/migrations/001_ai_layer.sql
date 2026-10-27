USE gov_services;

/* The live database uses service_requests. */

DROP PROCEDURE IF EXISTS add_ai_column_if_missing;
DELIMITER //
CREATE PROCEDURE add_ai_column_if_missing(
  IN column_name VARCHAR(64),
  IN column_definition TEXT
)
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'service_requests'
      AND COLUMN_NAME = column_name
  ) THEN
    SET @sql = CONCAT(
      'ALTER TABLE service_requests ADD COLUMN `',
      column_name,
      '` ',
      column_definition
    );
    PREPARE ai_stmt FROM @sql;
    EXECUTE ai_stmt;
    DEALLOCATE PREPARE ai_stmt;
  END IF;
END //
DELIMITER ;

CALL add_ai_column_if_missing('ai_risk_score', 'TINYINT NULL');
CALL add_ai_column_if_missing('ai_recommendation', 'VARCHAR(30) NULL');
CALL add_ai_column_if_missing('ai_summary', 'TEXT NULL');
CALL add_ai_column_if_missing('ai_findings', 'JSON NULL');
CALL add_ai_column_if_missing('ai_processed_at', 'TIMESTAMP NULL');

DROP PROCEDURE IF EXISTS add_ai_column_if_missing;

SHOW COLUMNS FROM service_requests
WHERE Field IN (
  'ai_risk_score',
  'ai_recommendation',
  'ai_summary',
  'ai_findings',
  'ai_processed_at'
);

SHOW CREATE TABLE application_events;
