package com.yukunxu.data4life.borrow;

import com.yukunxu.data4life.catalogue.Book;
import com.yukunxu.data4life.interest.NamedItem;
import com.yukunxu.data4life.loan.LoanStatus;

public record BorrowBookResponse(String isbn, String title, String author, NamedItem genre, NamedItem language,
        int stock, LoanStatus holding, Integer queuePosition, int queueLength) {

    public static BorrowBookResponse from(Book book, LoanStatus holding, Integer queuePosition, int queueLength) {
        return new BorrowBookResponse(book.getIsbn(), book.getTitle(), book.getAuthor(),
                new NamedItem(book.getGenre().getId(), book.getGenre().getName()),
                new NamedItem(book.getLanguage().getId(), book.getLanguage().getName()),
                book.getStock(), holding, queuePosition, queueLength);
    }
}
