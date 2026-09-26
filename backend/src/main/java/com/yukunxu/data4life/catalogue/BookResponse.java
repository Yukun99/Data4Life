package com.yukunxu.data4life.catalogue;

import com.yukunxu.data4life.interest.NamedItem;

public record BookResponse(String isbn, String title, String author, NamedItem genre, NamedItem language,
        int amount, int stock) {

    public static BookResponse from(Book book) {
        return new BookResponse(book.getIsbn(), book.getTitle(), book.getAuthor(),
                new NamedItem(book.getGenre().getId(), book.getGenre().getName()),
                new NamedItem(book.getLanguage().getId(), book.getLanguage().getName()),
                book.getAmount(), book.getStock());
    }
}
