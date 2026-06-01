-- Add UserId to vocabularies table only
USE voc_vocabulary;

-- First, check and drop old index if it exists
SELECT 'Starting migration...' AS status;

-- Add UserId column
ALTER TABLE `vocabularies`
  ADD COLUMN `UserId` int NULL AFTER `TopicId`;

-- Create new unique index
CREATE UNIQUE INDEX `IX_vocabularies_UserId_TopicId_Word` 
ON `vocabularies` (`UserId`, `TopicId`, `Word`);

-- Verify changes
SELECT 'UserId migration to vocabularies completed!' AS status;
DESCRIBE vocabularies;
