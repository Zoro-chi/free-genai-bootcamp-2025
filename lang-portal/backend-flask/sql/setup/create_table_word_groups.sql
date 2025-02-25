CREATE TABLE IF NOT EXISTS words_groups (
  word_id INTEGER NOT NULL,
  group_id INTEGER NOT NULL,
  PRIMARY KEY (word_id, group_id),
  FOREIGN KEY (word_id) REFERENCES words(id),
  FOREIGN KEY (group_id) REFERENCES groups(id)
);