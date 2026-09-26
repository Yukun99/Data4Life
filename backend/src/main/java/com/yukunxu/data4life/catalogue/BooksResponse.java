package com.yukunxu.data4life.catalogue;

import java.util.List;

public record BooksResponse(List<BookResponse> books, int page, int totalPages, long total, FilterOptions filters) {
}
