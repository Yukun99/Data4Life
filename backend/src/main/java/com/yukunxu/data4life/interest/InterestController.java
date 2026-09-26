package com.yukunxu.data4life.interest;

import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/interests")
public class InterestController {

    private final InterestService interestService;

    public InterestController(InterestService interestService) {
        this.interestService = interestService;
    }

    @GetMapping("/options")
    public InterestOptionsResponse options() {
        return interestService.options();
    }

    @GetMapping
    public InterestsResponse get(Principal principal) {
        return interestService.get(principal.getName());
    }

    @PutMapping
    public InterestsResponse save(@Valid @RequestBody SaveInterestsRequest request, Principal principal) {
        return interestService.save(principal.getName(), request.genreIds(), request.languageIds());
    }

    @PostMapping("/skip")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void skip(Principal principal) {
        interestService.skip(principal.getName());
    }
}
