package com.yukunxu.data4life.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class UserServiceTest {

    @Autowired
    private UserService userService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void createHashesPasswordAndNormalizesEmail() {
        User user = userService.create("Ada", " Ada@Example.com ", "secret123");

        assertThat(user.getId()).isNotNull();
        assertThat(user.getEmail()).isEqualTo("ada@example.com");
        assertThat(user.getPasswordHash()).isNotEqualTo("secret123");
        assertThat(passwordEncoder.matches("secret123", user.getPasswordHash())).isTrue();
    }

    @Test
    void createRejectsDuplicateEmail() {
        userService.create("Ada", "ada@example.com", "secret123");

        assertThatThrownBy(() -> userService.create("Other", "ADA@example.com", "secret456"))
                .isInstanceOf(EmailTakenException.class);
    }
}
