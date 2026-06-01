-- Create unique index for UserId, TopicId, Word combination
USE voc_vocabulary;

CREATE UNIQUE INDEX `IX_vocabularies_UserId_TopicId_Word` 
ON `vocabularies` (`UserId`, `TopicId`, `Word`);

SELECT 'Index created successfully!' AS status;
