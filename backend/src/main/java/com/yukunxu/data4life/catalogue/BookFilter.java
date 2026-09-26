package com.yukunxu.data4life.catalogue;

public record BookFilter(String isbn, String title, String author, Long genreId, Long languageId, Integer amount,
        Integer stock) {
}
