CREATE DATABASE IF NOT EXISTS voc_auth;
CREATE DATABASE IF NOT EXISTS voc_user;
CREATE DATABASE IF NOT EXISTS voc_vocabulary;
CREATE DATABASE IF NOT EXISTS voc_learning;
CREATE DATABASE IF NOT EXISTS voc_speaking;
CREATE DATABASE IF NOT EXISTS voc_analytics;

CREATE USER IF NOT EXISTS 'voc_user'@'%' IDENTIFIED BY 'ChangeMe123!';
GRANT ALL PRIVILEGES ON voc_auth.* TO 'voc_user'@'%';
GRANT ALL PRIVILEGES ON voc_user.* TO 'voc_user'@'%';
GRANT ALL PRIVILEGES ON voc_vocabulary.* TO 'voc_user'@'%';
GRANT ALL PRIVILEGES ON voc_learning.* TO 'voc_user'@'%';
GRANT ALL PRIVILEGES ON voc_speaking.* TO 'voc_user'@'%';
GRANT ALL PRIVILEGES ON voc_analytics.* TO 'voc_user'@'%';

CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;

FLUSH PRIVILEGES;
