-- Chuyển hệ thống vocabulary, bands và topics sang chế độ user-scoped
-- Các dữ liệu hiện có vẫn giữ nguyên là bộ data chung do admin cấp sẵn.

ALTER TABLE `bands`
  ADD COLUMN `UserId` int NULL AFTER `SortOrder`,
  DROP INDEX `IX_bands_Name`,
  ADD UNIQUE INDEX `IX_bands_UserId_Name` (`UserId`, `Name`);

ALTER TABLE `topics`
  ADD COLUMN `UserId` int NULL AFTER `ColorHex`,
  DROP INDEX `IX_topics_Name`,
  ADD UNIQUE INDEX `IX_topics_UserId_Name` (`UserId`, `Name`);

ALTER TABLE `vocabularies`
  ADD COLUMN `UserId` int NULL AFTER `TopicId`,
  DROP INDEX `IX_vocabularies_TopicId_Word`,
  ADD UNIQUE INDEX `IX_vocabularies_UserId_TopicId_Word` (`UserId`, `TopicId`, `Word`);
