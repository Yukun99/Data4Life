package com.yukunxu.data4life.catalogue;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface BookRepository extends JpaRepository<Book, String>, JpaSpecificationExecutor<Book> {

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
