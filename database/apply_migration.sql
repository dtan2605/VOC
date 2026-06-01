-- Apply UserId migration to topics and vocabularies
USE voc_vocabulary;

-- Add UserId to topics if it doesn't exist
ALTER TABLE `topics`
  ADD COLUMN `UserId` int NULL AFTER `ColorHex`;

-- Drop old unique index if exists and add new one with UserId
ALTER TABLE `topics` DROP INDEX IF EXISTS `IX_topics_Name`;
ALTER TABLE `topics` ADD UNIQUE INDEX `IX_topics_UserId_Name` (`UserId`, `Name`);

-- Add UserId to vocabularies if it doesn't exist  
ALTER TABLE `vocabularies`
  ADD COLUMN `UserId` int NULL AFTER `TopicId`;

-- Drop old unique index if exists and add new one with UserId
ALTER TABLE `vocabularies` DROP INDEX IF EXISTS `IX_vocabularies_TopicId_Word`;
ALTER TABLE `vocabularies` ADD UNIQUE INDEX `IX_vocabularies_UserId_TopicId_Word` (`UserId`, `TopicId`, `Word`);

-- Verify changes
SELECT 'Migration completed successfully' AS status;
DESCRIBE topics;
DESCRIBE vocabularies;
