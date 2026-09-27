package com.yukunxu.data4life.user;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class AdminPromoter implements ApplicationRunner {

    private final UserService userService;
    private final String adminPassword;

    public AdminPromoter(UserService userService, @Value("${app.admin-password:}") String adminPassword) {
        this.userService = userService;
        this.adminPassword = adminPassword;
    }

    @Override
    public void run(ApplicationArguments args) {
        userService.seedAdmin(adminPassword);
        userService.promoteAdmin();
    }
}
