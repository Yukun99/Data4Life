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

    @Column(name = "borrowed_at")
    private Instant borrowedAt;

    @Column(name = "due_at")
    private Instant dueAt;

    @Column(name = "returned_at")
    private Instant returnedAt;

    @Column(name = "fine_paid_at")
    private Instant finePaidAt;

    @Column(name = "fine_forgiven_at")
    private Instant fineForgivenAt;

    @Column(name = "reserved_at")
    private Instant reservedAt;

    @Column(name = "reserved_until")
    private Instant reservedUntil;

    @Column(name = "released_at")
    private Instant releasedAt;

    @Column(name = "removed_at")
    private Instant removedAt;

    protected Loan() {
    }

    public Loan(User user, Book book, Instant borrowedAt, Instant dueAt) {
        this.user = user;
        this.book = book;
        this.borrowedAt = borrowedAt;
        this.dueAt = dueAt;
    }

    public static Loan reserved(User user, Book book, Instant reservedAt, Instant reservedUntil) {
        Loan loan = new Loan(user, book, null, null);
        loan.reservedAt = reservedAt;
        loan.reservedUntil = reservedUntil;
        return loan;
    }

    /** A reservation waiting in the queue: no copy yet, so no end date. */
    public static Loan queued(User user, Book book, Instant reservedAt) {
        Loan loan = new Loan(user, book, null, null);
        loan.reservedAt = reservedAt;
        return loan;
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

    public void setBorrowedAt(Instant borrowedAt) {
        this.borrowedAt = borrowedAt;
    }

    public Instant getDueAt() {
        return dueAt;
    }

    public void setDueAt(Instant dueAt) {
        this.dueAt = dueAt;
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

    public Instant getReservedAt() {
        return reservedAt;
    }

    public Instant getReservedUntil() {
        return reservedUntil;
    }

    public void setReservedUntil(Instant reservedUntil) {
        this.reservedUntil = reservedUntil;
    }

    public Instant getReleasedAt() {
        return releasedAt;
    }

    public void setReleasedAt(Instant releasedAt) {
        this.releasedAt = releasedAt;
    }

    public Instant getRemovedAt() {
        return removedAt;
    }

    public void setRemovedAt(Instant removedAt) {
        this.removedAt = removedAt;
    }
}
