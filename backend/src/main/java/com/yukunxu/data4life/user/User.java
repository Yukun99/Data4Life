package com.yukunxu.data4life.user;

import com.yukunxu.data4life.catalogue.Genre;
import com.yukunxu.data4life.catalogue.Language;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "is_admin", nullable = false)
    private boolean admin;

    @Column(name = "interests_prompted", nullable = false)
    private boolean interestsPrompted;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Avatar avatar;

    @Column(name = "catalogue_columns", length = 100)
    private String catalogueColumns;

    @Column(name = "users_columns", length = 100)
    private String usersColumns;

    @Column(name = "promoted_by")
    private Long promotedById;

    @ManyToMany
    @JoinTable(name = "user_genres", joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "genre_id"))
    private Set<Genre> genres = new HashSet<>();

    @ManyToMany
    @JoinTable(name = "user_languages", joinColumns = @JoinColumn(name = "user_id"),
            inverseJoinColumns = @JoinColumn(name = "language_id"))
    private Set<Language> languages = new HashSet<>();

    protected User() {
    }

    public User(String email, String name, String passwordHash) {
        this.email = email;
        this.name = name;
        this.passwordHash = passwordHash;
        this.createdAt = Instant.now();
        this.admin = false;
        this.avatar = Avatar.ACCOUNT;
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean isAdmin() {
        return admin;
    }

    public void setAdmin(boolean admin) {
        this.admin = admin;
    }

    public boolean isInterestsPrompted() {
        return interestsPrompted;
    }

    public void setInterestsPrompted(boolean interestsPrompted) {
        this.interestsPrompted = interestsPrompted;
    }

    public Avatar getAvatar() {
        return avatar;
    }

    public void setAvatar(Avatar avatar) {
        this.avatar = avatar;
    }

    public String getCatalogueColumns() {
        return catalogueColumns;
    }

    public void setCatalogueColumns(String catalogueColumns) {
        this.catalogueColumns = catalogueColumns;
    }

    public String getUsersColumns() {
        return usersColumns;
    }

    public void setUsersColumns(String usersColumns) {
        this.usersColumns = usersColumns;
    }

    public Long getPromotedById() {
        return promotedById;
    }

    public void setPromotedById(Long promotedById) {
        this.promotedById = promotedById;
    }

    public Set<Genre> getGenres() {
        return genres;
    }

    public Set<Language> getLanguages() {
        return languages;
    }
}
