package com.yukunxu.data4life.returns;

import java.math.BigDecimal;
import java.util.List;

public record ReturnLoansResponse(List<ReturnLoanResponse> loans, int page, int totalPages, long total,
        ReturnFilterOptions filters, BigDecimal totalUnpaid) {
}
