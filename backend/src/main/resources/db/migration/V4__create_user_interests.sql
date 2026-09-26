ALTER TABLE users ADD COLUMN interests_prompted BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE user_genres (
    user_id  BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    genre_id BIGINT NOT NULL REFERENCES genres (id),
    PRIMARY KEY (user_id, genre_id)
);

CREATE TABLE user_languages (
    user_id     BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    language_id BIGINT NOT NULL REFERENCES languages (id),
    PRIMARY KEY (user_id, language_id)
);
