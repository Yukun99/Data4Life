ALTER TABLE users ADD COLUMN promoted_by BIGINT;
ALTER TABLE users ADD CONSTRAINT users_promoted_by_fk FOREIGN KEY (promoted_by) REFERENCES users (id);
ALTER TABLE users ADD COLUMN users_columns VARCHAR(100);
