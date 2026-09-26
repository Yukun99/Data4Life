package com.yukunxu.data4life.catalogue;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookRepository extends JpaRepository<Book, String>, JpaSpecificationExecutor<Book> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from Book b where b.isbn = :isbn")
    Optional<Book> lockByIsbn(@Param("isbn") String isbn);

    @Query("select distinct b.isbn from Book b order by b.isbn")
    List<String> distinctIsbns();

    @Query("select distinct b.title from Book b order by b.title")
    List<String> distinctTitles();

    @Query("select distinct b.author from Book b order by b.author")
    List<String> distinctAuthors();

    @Query("select distinct b.amount from Book b order by b.amount")
    List<Integer> distinctAmounts();

    @Query("select distinct b.stock from Book b order by b.stock")
    List<Integer> distinctStocks();
}
