ALTER TABLE loans ADD COLUMN removed_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX loans_book_isbn_idx ON loans (book_isbn);

CREATE TABLE notifications (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    BIGINT                   NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    loan_id    BIGINT                   NOT NULL REFERENCES loans (id) ON DELETE CASCADE,
    type       VARCHAR(20)              NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    read_at    TIMESTAMP WITH TIME ZONE
);

CREATE INDEX notifications_user_id_idx ON notifications (user_id, id);
