-- Update EF Core migration history to mark UserOwnership migration as applied
USE voc_vocabulary;

INSERT INTO __EFMigrationsHistory (`MigrationId`, `ProductVersion`)
VALUES ('20250526123000_AddUserOwnershipToVocabularySchema', '10.0.0')
ON DUPLICATE KEY UPDATE `ProductVersion` = VALUES(`ProductVersion`);

SELECT 'Migration history updated' AS status;
