package com.yukunxu.data4life.loan;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ReservationReleaser {

    private final LoanService loanService;

    public ReservationReleaser(LoanService loanService) {
        this.loanService = loanService;
    }

    @Scheduled(fixedDelayString = "PT10M", initialDelayString = "PT10M")
    public void release() {
        loanService.releaseExpired();
    }
}
