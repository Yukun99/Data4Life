package com.yukunxu.data4life.user;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
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
    private UserRepository repository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Test
    void createHashesPasswordAndNormalizesEmail() {
        User user = userService.create("Ada", " Ada@Example.com ", "secret123");

        assertThat(user.getId()).isNotNull();
        assertThat(user.getEmail()).isEqualTo("ada@example.com");
        assertThat(user.getPasswordHash()).isNotEqualTo("secret123");
        assertThat(passwordEncoder.matches("secret123", user.getPasswordHash())).isTrue();
        assertThat(user.isAdmin()).isFalse();
    }

    @Test
    void createRejectsDuplicateEmail() {
        userService.create("Ada", "ada@example.com", "secret123");

        assertThatThrownBy(() -> userService.create("Other", "ADA@example.com", "secret456"))
                .isInstanceOf(EmailTakenException.class);
    }

    @Test
    void loadUserByUsernameGivesAdminRole() {
        userService.create("Admin", "Admin@Example.com", "secret123");
        userService.create("Ada", "ada@example.com", "secret123");

        assertThat(authorities(userService.loadUserByUsername("admin@example.com")))
                .containsExactlyInAnyOrder("ROLE_USER", "ROLE_ADMIN");
        assertThat(authorities(userService.loadUserByUsername("ada@example.com")))
                .containsExactly("ROLE_USER");
    }

    @Test
    void promoteAdminFlipsExistingAdminEmail() {
        User admin = new User("admin@example.com", "Admin", "hash");
        admin.setAdmin(false);
        repository.save(admin);
        User other = repository.save(new User("ada@example.com", "Ada", "hash"));

        userService.promoteAdmin();

        assertThat(repository.findByEmail("admin@example.com").orElseThrow().isAdmin()).isTrue();
        assertThat(repository.findByEmail(other.getEmail()).orElseThrow().isAdmin()).isFalse();
    }

    @Test
    void updateProfileTrimsNameAndSetsAvatar() {
        User created = userService.create("Ada", "ada@example.com", "secret123");
        assertThat(created.getAvatar()).isEqualTo(Avatar.ACCOUNT);

        User updated = userService.updateProfile("ADA@example.com", "  Ada L ", Avatar.STAR);

        assertThat(updated.getName()).isEqualTo("Ada L");
        assertThat(updated.getAvatar()).isEqualTo(Avatar.STAR);
    }

    private static List<String> authorities(UserDetails details) {
        return details.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList();
    }
}
