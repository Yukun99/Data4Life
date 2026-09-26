package com.yukunxu.data4life.loan;

import com.yukunxu.data4life.catalogue.Book;
import com.yukunxu.data4life.user.User;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LoanRepository extends JpaRepository<Loan, Long> {

    @Query("select l from Loan l where l.user = :user order by coalesce(l.borrowedAt, l.reservedAt) desc")
    List<Loan> findByUserNewestFirst(@Param("user") User user);

    boolean existsByUser(User user);

    @Query("select l from Loan l join fetch l.user")
    List<Loan> findAllWithUser();

    boolean existsByBook(Book book);

    long countByBookAndReturnedAtIsNullAndReleasedAtIsNull(Book book);

    List<Loan> findByUserAndReturnedAtIsNullAndReleasedAtIsNull(User user);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select l from Loan l where l.borrowedAt is null and l.releasedAt is null and l.reservedUntil < :now
            order by l.id""")
    List<Loan> lockExpiredReservations(@Param("now") Instant now);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("update Loan l set l.book = :to where l.book = :from")
    void repoint(@Param("from") Book from, @Param("to") Book to);
}
