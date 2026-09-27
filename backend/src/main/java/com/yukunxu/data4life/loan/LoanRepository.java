package com.yukunxu.data4life.loan;

import com.yukunxu.data4life.catalogue.Book;
import com.yukunxu.data4life.user.User;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
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

    @Query("""
            select count(l) from Loan l where l.book = :book and l.returnedAt is null and l.releasedAt is null
            and (l.borrowedAt is not null or l.reservedUntil is not null)""")
    long countCopiesHeld(@Param("book") Book book);

    @Query("""
            select l from Loan l join fetch l.user where l.book.isbn in :isbns and l.borrowedAt is null
            and l.reservedUntil is null and l.releasedAt is null order by l.reservedAt, l.id""")
    List<Loan> findQueued(@Param("isbns") Collection<String> isbns);

    @Query("select l.book.isbn from Loan l where l.id = :id and l.user = :user")
    Optional<String> isbnOf(@Param("id") Long id, @Param("user") User user);

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
