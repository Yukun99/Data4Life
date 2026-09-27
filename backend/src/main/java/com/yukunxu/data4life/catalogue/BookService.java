package com.yukunxu.data4life.catalogue;

import com.yukunxu.data4life.interest.NamedItem;
import com.yukunxu.data4life.loan.LoanRepository;
import com.yukunxu.data4life.loan.LoanService;
import jakarta.persistence.criteria.Predicate;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class BookService {

    public static final Set<Integer> PAGE_SIZES = Set.of(10, 20, 50);

    private static final Map<String, String> SORT_FIELDS = Map.of(
            "isbn", "isbn", "title", "title", "author", "author", "genre", "genre.name",
            "language", "language.name", "amount", "amount", "stock", "stock");

    private final BookRepository bookRepository;
    private final GenreRepository genreRepository;
    private final LanguageRepository languageRepository;
    private final LoanRepository loanRepository;
    private final LoanService loanService;

    public BookService(BookRepository bookRepository, GenreRepository genreRepository,
            LanguageRepository languageRepository, LoanRepository loanRepository, LoanService loanService) {
        this.bookRepository = bookRepository;
        this.genreRepository = genreRepository;
        this.languageRepository = languageRepository;
        this.loanRepository = loanRepository;
        this.loanService = loanService;
    }

    @Transactional(readOnly = true)
    public BooksResponse list(BookFilter filter, int page, int size, String sort, String dir) {
        Page<Book> result = page(filter, page, size, sort, dir);
        return new BooksResponse(result.getContent().stream().map(BookResponse::from).toList(),
                result.getNumber(), result.getTotalPages(), result.getTotalElements(), filterOptions());
    }

    /** Validates size and sort, then returns the requested page, clamped to the last one. */
    @Transactional(readOnly = true)
    public Page<Book> page(BookFilter filter, int page, int size, String sort, String dir) {
        if (!PAGE_SIZES.contains(size)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid page size");
        }
        String field = SORT_FIELDS.get(sort);
        if (field == null || !(dir.equals("asc") || dir.equals("desc"))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid sort");
        }
        Sort order = Sort.by(Sort.Direction.fromString(dir), field).and(Sort.by("isbn"));
        Specification<Book> spec = matching(filter);
        Page<Book> result = bookRepository.findAll(spec, PageRequest.of(Math.max(page, 0), size, order));
        if (result.getTotalPages() > 0 && result.getNumber() >= result.getTotalPages()) {
            result = bookRepository.findAll(spec, PageRequest.of(result.getTotalPages() - 1, size, order));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public BookResponse get(String isbn) {
        return BookResponse.from(find(isbn));
    }

    @Transactional
    public BookResponse create(BookRequest request) {
        String isbn = request.isbn().trim();
        if (bookRepository.existsById(isbn)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "ISBN already exists");
        }
        Book book = new Book(isbn, request.title().trim(), request.author().trim(), genre(request),
                language(request), request.amount(), request.amount());
        return BookResponse.from(bookRepository.save(book));
    }

    @Transactional
    public BookResponse update(String isbn, BookRequest request) {
        loanService.releaseExpired();
        Book book = lock(isbn);
        int open = (int) loanRepository.countCopiesHeld(book);
        checkAmount(request.amount(), open);
        Genre genre = genre(request);
        Language language = language(request);
        String newIsbn = request.isbn().trim();
        if (newIsbn.equals(book.getIsbn())) {
            apply(book, request, genre, language, open);
            loanService.serveQueue(book, Instant.now());
            return BookResponse.from(book);
        }
        if (bookRepository.existsById(newIsbn)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "ISBN already exists");
        }
        Book moved = bookRepository.saveAndFlush(new Book(newIsbn, request.title().trim(),
                request.author().trim(), genre, language, request.amount(), request.amount() - open));
        loanRepository.repoint(book, moved);
        bookRepository.deleteById(isbn);
        Book result = find(newIsbn);
        loanService.serveQueue(result, Instant.now());
        return BookResponse.from(result);
    }

    @Transactional
    public BookResponse merge(String sourceIsbn, BookRequest request) {
        String targetIsbn = request.isbn().trim();
        if (targetIsbn.equals(sourceIsbn)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot merge a book into itself");
        }
        loanService.releaseExpired();
        Book source = lock(sourceIsbn);
        Book target = bookRepository.lockByIsbn(targetIsbn)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Merge target not found"));
        int open = (int) (loanRepository.countCopiesHeld(source) + loanRepository.countCopiesHeld(target));
        checkAmount(request.amount(), open);
        Long genreId = genre(request).getId();
        Long languageId = language(request).getId();
        loanRepository.repoint(source, target);
        bookRepository.deleteById(sourceIsbn);
        Book merged = find(targetIsbn);
        apply(merged, request, genreRepository.getReferenceById(genreId),
                languageRepository.getReferenceById(languageId), open);
        loanService.serveQueue(merged, Instant.now());
        return BookResponse.from(merged);
    }

    @Transactional
    public void delete(String isbn) {
        Book book = find(isbn);
        if (loanRepository.existsByBook(book)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Book has loan records");
        }
        bookRepository.delete(book);
    }

    private static Specification<Book> matching(BookFilter filter) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (filter.isbn() != null) {
                predicates.add(cb.equal(root.get("isbn"), filter.isbn()));
            }
            if (filter.title() != null) {
                predicates.add(cb.equal(root.get("title"), filter.title()));
            }
            if (filter.author() != null) {
                predicates.add(cb.equal(root.get("author"), filter.author()));
            }
            if (filter.genreId() != null) {
                predicates.add(cb.equal(root.get("genre").get("id"), filter.genreId()));
            }
            if (filter.languageId() != null) {
                predicates.add(cb.equal(root.get("language").get("id"), filter.languageId()));
            }
            if (filter.amount() != null) {
                predicates.add(cb.equal(root.get("amount"), filter.amount()));
            }
            if (filter.stock() != null) {
                predicates.add(cb.equal(root.get("stock"), filter.stock()));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    @Transactional(readOnly = true)
    public FilterOptions filterOptions() {
        return new FilterOptions(bookRepository.distinctIsbns(), bookRepository.distinctTitles(),
                bookRepository.distinctAuthors(),
                genreRepository.findAllByOrderByNameAsc().stream()
                        .map(g -> new NamedItem(g.getId(), g.getName())).toList(),
                languageRepository.findAllByOrderByNameAsc().stream()
                        .map(l -> new NamedItem(l.getId(), l.getName())).toList(),
                bookRepository.distinctAmounts(), bookRepository.distinctStocks());
    }

    private static void apply(Book book, BookRequest request, Genre genre, Language language, int open) {
        book.setTitle(request.title().trim());
        book.setAuthor(request.author().trim());
        book.setGenre(genre);
        book.setLanguage(language);
        book.setAmount(request.amount());
        book.setStock(request.amount() - open);
    }

    private static void checkAmount(int amount, int open) {
        if (amount < open) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Amount is below copies on loan");
        }
    }

    private Book lock(String isbn) {
        return bookRepository.lockByIsbn(isbn)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
    }

    private Book find(String isbn) {
        return bookRepository.findById(isbn)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Book not found"));
    }

    private Genre genre(BookRequest request) {
        return genreRepository.findById(request.genreId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown genre"));
    }

    private Language language(BookRequest request) {
        return languageRepository.findById(request.languageId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown language"));
    }
}
