package com.yukunxu.data4life.user;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class AdminPromoter implements ApplicationRunner {

    private final UserService userService;

    public AdminPromoter(UserService userService) {
        this.userService = userService;
    }

    @Override
    public void run(ApplicationArguments args) {
        userService.promoteAdmin();
    }
}
