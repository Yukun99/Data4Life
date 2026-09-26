CREATE TABLE books (
    isbn        VARCHAR(20)  PRIMARY KEY,
    title       VARCHAR(255) NOT NULL,
    author      VARCHAR(255) NOT NULL,
    genre_id    BIGINT       NOT NULL REFERENCES genres (id),
    language_id BIGINT       NOT NULL REFERENCES languages (id),
    amount      INTEGER      NOT NULL CHECK (amount >= 0),
    stock       INTEGER      NOT NULL,
    CHECK (stock >= 0 AND stock <= amount)
);

INSERT INTO books (isbn, title, author, genre_id, language_id, amount, stock) VALUES
    ('9780062316097', 'Sapiens: A Brief History of Humankind', 'Yuval Noah Harari',
        (SELECT id FROM genres WHERE name = 'History'), (SELECT id FROM languages WHERE name = 'English'), 5, 5),
    ('9780062693662', 'Murder on the Orient Express', 'Agatha Christie',
        (SELECT id FROM genres WHERE name = 'Mystery'), (SELECT id FROM languages WHERE name = 'English'), 5, 5),
    ('9780141439518', 'Pride and Prejudice', 'Jane Austen',
        (SELECT id FROM genres WHERE name = 'Romance'), (SELECT id FROM languages WHERE name = 'English'), 3, 3),
    ('9780261103573', 'The Fellowship of the Ring', 'J. R. R. Tolkien',
        (SELECT id FROM genres WHERE name = 'Fantasy'), (SELECT id FROM languages WHERE name = 'English'), 4, 4),
    ('9780307474278', 'The Da Vinci Code', 'Dan Brown',
        (SELECT id FROM genres WHERE name = 'Thriller'), (SELECT id FROM languages WHERE name = 'English'), 2, 2),
    ('9780441172719', 'Dune', 'Frank Herbert',
        (SELECT id FROM genres WHERE name = 'Science Fiction'), (SELECT id FROM languages WHERE name = 'English'), 3, 3),
    ('9782070612758', 'Le Petit Prince', 'Antoine de Saint-Exupéry',
        (SELECT id FROM genres WHERE name = 'Children''s'), (SELECT id FROM languages WHERE name = 'French'), 2, 2),
    ('9784101010137', 'Kokoro', 'Natsume Soseki',
        (SELECT id FROM genres WHERE name = 'Literary Fiction'), (SELECT id FROM languages WHERE name = 'Japanese'), 2, 2),
    ('9787020002207', 'Dream of the Red Chamber', 'Cao Xueqin',
        (SELECT id FROM genres WHERE name = 'Literary Fiction'), (SELECT id FROM languages WHERE name = 'Chinese'), 3, 3),
    ('9788497592208', 'Cien años de soledad', 'Gabriel García Márquez',
        (SELECT id FROM genres WHERE name = 'Literary Fiction'), (SELECT id FROM languages WHERE name = 'Spanish'), 4, 4);
