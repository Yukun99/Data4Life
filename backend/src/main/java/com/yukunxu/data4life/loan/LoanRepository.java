package com.yukunxu.data4life.loan;

import com.yukunxu.data4life.user.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LoanRepository extends JpaRepository<Loan, Long> {

    List<Loan> findByUserOrderByBorrowedAtDesc(User user);

    boolean existsByUser(User user);
}
