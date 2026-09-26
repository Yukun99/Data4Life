CREATE TABLE genres (
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE languages (
    id   BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

INSERT INTO genres (name) VALUES
    ('Fantasy'), ('Science Fiction'), ('Mystery'), ('Thriller'), ('Romance'), ('Horror'),
    ('Historical Fiction'), ('Literary Fiction'), ('Biography'), ('Memoir'), ('History'), ('Science'),
    ('Self-Help'), ('Business'), ('Poetry'), ('Children''s'), ('Young Adult'), ('Graphic Novel'),
    ('Travel'), ('Cooking'), ('Philosophy'), ('Religion'), ('Art'), ('Technology');

INSERT INTO languages (name) VALUES
    ('English'), ('Chinese'), ('Malay'), ('Tamil'), ('Japanese'), ('Korean'), ('French'), ('German'),
    ('Spanish'), ('Italian'), ('Portuguese'), ('Russian'), ('Arabic'), ('Hindi'), ('Thai'),
    ('Vietnamese'), ('Indonesian');
