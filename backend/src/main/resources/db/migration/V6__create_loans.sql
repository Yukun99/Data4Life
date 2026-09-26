CREATE TABLE loans (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      BIGINT                   NOT NULL REFERENCES users (id),
    book_isbn    VARCHAR(20)              NOT NULL REFERENCES books (isbn),
    borrowed_at  TIMESTAMP WITH TIME ZONE NOT NULL,
    due_at       TIMESTAMP WITH TIME ZONE NOT NULL,
    returned_at  TIMESTAMP WITH TIME ZONE,
    fine_paid_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX loans_user_id_idx ON loans (user_id);
