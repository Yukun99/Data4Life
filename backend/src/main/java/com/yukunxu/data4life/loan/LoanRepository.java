package com.yukunxu.data4life.loan;

import com.yukunxu.data4life.catalogue.Book;
import com.yukunxu.data4life.user.User;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LoanRepository extends JpaRepository<Loan, Long> {

    List<Loan> findByUserOrderByBorrowedAtDesc(User user);

    boolean existsByUser(User user);

    boolean existsByBook(Book book);

    long countByBookAndReturnedAtIsNull(Book book);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update Loan l set l.book = :to where l.book = :from")
    void repoint(@Param("from") Book from, @Param("to") Book to);
}
