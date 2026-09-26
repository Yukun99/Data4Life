package com.yukunxu.data4life.interest;

import com.yukunxu.data4life.catalogue.Genre;
import com.yukunxu.data4life.catalogue.GenreRepository;
import com.yukunxu.data4life.catalogue.Language;
import com.yukunxu.data4life.catalogue.LanguageRepository;
import com.yukunxu.data4life.user.User;
import com.yukunxu.data4life.user.UserService;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Function;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class InterestService {

    public static final int MAX_INTERESTS = 10;

    private final UserService userService;
    private final GenreRepository genreRepository;
    private final LanguageRepository languageRepository;

    public InterestService(UserService userService, GenreRepository genreRepository,
            LanguageRepository languageRepository) {
        this.userService = userService;
        this.genreRepository = genreRepository;
        this.languageRepository = languageRepository;
    }

    @Transactional(readOnly = true)
    public InterestOptionsResponse options() {
        return new InterestOptionsResponse(
                genreRepository.findAllByOrderByNameAsc().stream().map(g -> new NamedItem(g.getId(), g.getName())).toList(),
                languageRepository.findAllByOrderByNameAsc().stream().map(l -> new NamedItem(l.getId(), l.getName())).toList());
    }

    @Transactional(readOnly = true)
    public InterestsResponse get(String email) {
        return toResponse(userService.getByEmail(email));
    }

    @Transactional
    public InterestsResponse save(String email, List<Long> genreIds, List<Long> languageIds) {
        Set<Long> uniqueGenres = new HashSet<>(genreIds);
        Set<Long> uniqueLanguages = new HashSet<>(languageIds);
        if (uniqueGenres.size() + uniqueLanguages.size() > MAX_INTERESTS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose at most " + MAX_INTERESTS + " interests");
        }
        List<Genre> genres = genreRepository.findAllById(uniqueGenres);
        if (genres.size() != uniqueGenres.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown genre");
        }
        List<Language> languages = languageRepository.findAllById(uniqueLanguages);
        if (languages.size() != uniqueLanguages.size()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unknown language");
        }
        User user = userService.getByEmail(email);
        user.getGenres().clear();
        user.getGenres().addAll(genres);
        user.getLanguages().clear();
        user.getLanguages().addAll(languages);
        user.setInterestsPrompted(true);
        return toResponse(user);
    }

    @Transactional
    public void skip(String email) {
        userService.getByEmail(email).setInterestsPrompted(true);
    }

    private static InterestsResponse toResponse(User user) {
        return new InterestsResponse(
                sorted(user.getGenres(), g -> new NamedItem(g.getId(), g.getName())),
                sorted(user.getLanguages(), l -> new NamedItem(l.getId(), l.getName())),
                user.isInterestsPrompted());
    }

    private static <T> List<NamedItem> sorted(Collection<T> items, Function<T, NamedItem> toItem) {
        return items.stream().map(toItem).sorted(Comparator.comparing(NamedItem::name)).toList();
    }
}
