USE voc_vocabulary;

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_initialize_user_vocabulary`$$
CREATE PROCEDURE `sp_initialize_user_vocabulary`(IN p_userId INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Clone all global default bands for the user, if not already present.
    INSERT IGNORE INTO bands (UserId, Name, Description, SortOrder)
    SELECT p_userId, Name, Description, SortOrder
    FROM bands
    WHERE UserId IS NULL;

    -- Clone all global default topics for the user, if not already present.
    INSERT IGNORE INTO topics (UserId, Name, Description, ColorHex)
    SELECT p_userId, Name, Description, ColorHex
    FROM topics
    WHERE UserId IS NULL;

    CREATE TEMPORARY TABLE IF NOT EXISTS temp_band_mapping (
        old_band_id INT PRIMARY KEY,
        new_band_id INT
    );

    CREATE TEMPORARY TABLE IF NOT EXISTS temp_topic_mapping (
        old_topic_id INT PRIMARY KEY,
        new_topic_id INT
    );

    CREATE TEMPORARY TABLE IF NOT EXISTS temp_vocab_mapping (
        old_vocab_id INT PRIMARY KEY,
        new_vocab_id INT
    );

    TRUNCATE TABLE temp_band_mapping;
    TRUNCATE TABLE temp_topic_mapping;
    TRUNCATE TABLE temp_vocab_mapping;

    INSERT INTO temp_band_mapping (old_band_id, new_band_id)
    SELECT g.Id, u.Id
    FROM bands AS g
    JOIN bands AS u ON u.Name = g.Name AND u.UserId = p_userId
    WHERE g.UserId IS NULL;

    INSERT INTO temp_topic_mapping (old_topic_id, new_topic_id)
    SELECT g.Id, u.Id
    FROM topics AS g
    JOIN topics AS u ON u.Name = g.Name AND u.UserId = p_userId
    WHERE g.UserId IS NULL;

    -- Clone all global default vocabulary for the user, preserving the band/topic mapping.
    INSERT IGNORE INTO vocabularies
        (UserId, Word, Meaning, PartOfSpeech, Pronunciation, BandId, TopicId, CreatedAt, UpdatedAt)
    SELECT
        p_userId,
        v.Word,
        v.Meaning,
        v.PartOfSpeech,
        v.Pronunciation,
        bm.new_band_id,
        tm.new_topic_id,
        NOW(),
        NOW()
    FROM vocabularies AS v
    JOIN temp_band_mapping AS bm ON v.BandId = bm.old_band_id
    JOIN temp_topic_mapping AS tm ON v.TopicId = tm.old_topic_id
    WHERE v.UserId IS NULL
      AND NOT EXISTS (
          SELECT 1
          FROM vocabularies AS u
          WHERE u.UserId = p_userId
            AND u.Word = v.Word
            AND u.TopicId = tm.new_topic_id
      );

    INSERT INTO temp_vocab_mapping (old_vocab_id, new_vocab_id)
    SELECT
        v.Id,
        u.Id
    FROM vocabularies AS v
    JOIN temp_topic_mapping AS tm ON v.TopicId = tm.old_topic_id
    JOIN vocabularies AS u
      ON u.UserId = p_userId
     AND u.Word = v.Word
     AND u.TopicId = tm.new_topic_id
    WHERE v.UserId IS NULL;

    -- Copy example sentences for the cloned vocabulary.
    INSERT INTO examples (VocabularyId, EnglishText, VietnameseMeaning, DisplayOrder)
    SELECT
        tm.new_vocab_id,
        e.EnglishText,
        e.VietnameseMeaning,
        e.DisplayOrder
    FROM examples AS e
    JOIN temp_vocab_mapping AS tm ON e.VocabularyId = tm.old_vocab_id
    WHERE NOT EXISTS (
        SELECT 1
        FROM examples AS ex
        WHERE ex.VocabularyId = tm.new_vocab_id
          AND ex.EnglishText = e.EnglishText
          AND ex.VietnameseMeaning = e.VietnameseMeaning
          AND ex.DisplayOrder = e.DisplayOrder
    );

    DROP TEMPORARY TABLE IF EXISTS temp_band_mapping;
    DROP TEMPORARY TABLE IF EXISTS temp_topic_mapping;
    DROP TEMPORARY TABLE IF EXISTS temp_vocab_mapping;

    COMMIT;
END$$

DELIMITER ;
