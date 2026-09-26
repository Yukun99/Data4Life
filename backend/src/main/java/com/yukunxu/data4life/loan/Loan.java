package com.yukunxu.data4life.loan;

import com.yukunxu.data4life.catalogue.Book;
import com.yukunxu.data4life.user.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "loans")
public class Loan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "book_isbn", nullable = false)
    private Book book;

    @Column(name = "borrowed_at", nullable = false)
    private Instant borrowedAt;

    @Column(name = "due_at", nullable = false)
    private Instant dueAt;

    @Column(name = "returned_at")
    private Instant returnedAt;

    @Column(name = "fine_paid_at")
    private Instant finePaidAt;

    @Column(name = "fine_forgiven_at")
    private Instant fineForgivenAt;

    protected Loan() {
    }

    public Loan(User user, Book book, Instant borrowedAt, Instant dueAt) {
        this.user = user;
        this.book = book;
        this.borrowedAt = borrowedAt;
        this.dueAt = dueAt;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public Book getBook() {
        return book;
    }

    public Instant getBorrowedAt() {
        return borrowedAt;
    }

    public Instant getDueAt() {
        return dueAt;
    }

    public Instant getReturnedAt() {
        return returnedAt;
    }

    public void setReturnedAt(Instant returnedAt) {
        this.returnedAt = returnedAt;
    }

    public Instant getFinePaidAt() {
        return finePaidAt;
    }

    public void setFinePaidAt(Instant finePaidAt) {
        this.finePaidAt = finePaidAt;
    }

    public Instant getFineForgivenAt() {
        return fineForgivenAt;
    }

    public void setFineForgivenAt(Instant fineForgivenAt) {
        this.fineForgivenAt = fineForgivenAt;
    }
}
