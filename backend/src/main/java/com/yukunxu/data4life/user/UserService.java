package com.yukunxu.data4life.user;

import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService implements UserDetailsService {

    private final UserRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final String adminEmail;

    public UserService(UserRepository repository, PasswordEncoder passwordEncoder,
            @Value("${app.admin-email:}") String adminEmail) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.adminEmail = normalize(adminEmail);
    }

    @Transactional
    public User create(String name, String email, String password) {
        String normalized = normalize(email);
        if (repository.existsByEmail(normalized)) {
            throw new EmailTakenException();
        }
        User user = new User(normalized, name.trim(), passwordEncoder.encode(password));
        user.setAdmin(!adminEmail.isEmpty() && adminEmail.equals(normalized));
        return repository.save(user);
    }

    @Transactional(readOnly = true)
    public User getByEmail(String email) {
        return repository.findByEmail(normalize(email))
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

    @Transactional
    public User updateProfile(String email, String name, Avatar avatar) {
        User user = getByEmail(email);
        user.setName(name.trim());
        user.setAvatar(avatar);
        return repository.save(user);
    }

    @Transactional
    public void promoteAdmin() {
        if (adminEmail.isEmpty()) {
            return;
        }
        repository.findByEmail(adminEmail)
                .filter(user -> !user.isAdmin())
                .ifPresent(user -> {
                    user.setAdmin(true);
                    repository.save(user);
                });
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) {
        User user = getByEmail(email);
        return org.springframework.security.core.userdetails.User.withUsername(user.getEmail())
                .password(user.getPasswordHash())
                .roles(user.isAdmin() ? new String[] {"USER", "ADMIN"} : new String[] {"USER"})
                .build();
    }

    private static String normalize(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
