package com.yukunxu.data4life.borrow;

import com.yukunxu.data4life.catalogue.FilterOptions;
import java.util.List;

public record BorrowBooksResponse(List<BorrowBookResponse> books, int page, int totalPages, long total,
        FilterOptions filters, String block, String convertBlock) {
}
