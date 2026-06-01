-- Check current schema and apply migrations if needed
USE voc_vocabulary;

-- Check if UserId column exists in bands
SELECT IF(
    EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME='bands' AND COLUMN_NAME='UserId' AND TABLE_SCHEMA='voc_vocabulary'),
    'UserId already exists in bands',
    'UserId does NOT exist in bands'
) AS bands_status;

-- Check if UserId column exists in topics
SELECT IF(
    EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME='topics' AND COLUMN_NAME='UserId' AND TABLE_SCHEMA='voc_vocabulary'),
    'UserId already exists in topics',
    'UserId does NOT exist in topics'
) AS topics_status;

-- Check if UserId column exists in vocabularies
SELECT IF(
    EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME='vocabularies' AND COLUMN_NAME='UserId' AND TABLE_SCHEMA='voc_vocabulary'),
    'UserId already exists in vocabularies',
    'UserId does NOT exist in vocabularies'
) AS vocabularies_status;

-- Show current structure
DESCRIBE bands;
DESCRIBE topics;
DESCRIBE vocabularies;
