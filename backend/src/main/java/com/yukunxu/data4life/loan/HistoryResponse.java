package com.yukunxu.data4life.loan;

import java.util.List;

public record HistoryResponse(HistoryStats stats, List<LoanResponse> loans) {
}
