package com.yukunxu.data4life.catalogue;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/books")
@PreAuthorize("hasRole('ADMIN')")
public class BookController {

    private final BookService bookService;

    public BookController(BookService bookService) {
        this.bookService = bookService;
    }

    @GetMapping
    public BooksResponse list(@ModelAttribute BookFilter filter, @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size, @RequestParam(defaultValue = "title") String sort,
            @RequestParam(defaultValue = "asc") String dir) {
        return bookService.list(filter, page, size, sort, dir);
    }

    @GetMapping("/{isbn}")
    public BookResponse get(@PathVariable String isbn) {
        return bookService.get(isbn);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public BookResponse create(@Valid @RequestBody BookRequest request) {
        return bookService.create(request);
    }

    @PutMapping("/{isbn}")
    public BookResponse update(@PathVariable String isbn, @Valid @RequestBody BookRequest request) {
        return bookService.update(isbn, request);
    }

    @PostMapping("/{isbn}/merge")
    public BookResponse merge(@PathVariable String isbn, @Valid @RequestBody BookRequest request) {
        return bookService.merge(isbn, request);
    }

    @DeleteMapping("/{isbn}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String isbn) {
        bookService.delete(isbn);
    }
}
