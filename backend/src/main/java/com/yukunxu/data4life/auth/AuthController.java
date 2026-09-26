package com.yukunxu.data4life.auth;

import com.yukunxu.data4life.admin.AdminUserService;
import com.yukunxu.data4life.user.UserResponse;
import com.yukunxu.data4life.user.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import java.security.Principal;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.session.SessionRegistry;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final SessionRegistry sessionRegistry;
    private final AdminUserService adminUserService;
    private final SecurityContextRepository contextRepository = new HttpSessionSecurityContextRepository();

    public AuthController(AuthenticationManager authenticationManager, UserService userService,
            SessionRegistry sessionRegistry, AdminUserService adminUserService) {
        this.authenticationManager = authenticationManager;
        this.userService = userService;
        this.sessionRegistry = sessionRegistry;
        this.adminUserService = adminUserService;
    }

    @PostMapping("/login")
    public UserResponse login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(request.email(), request.password()));
        HttpSession existing = httpRequest.getSession(false);
        if (existing != null) {
            sessionRegistry.removeSessionInformation(existing.getId());
            httpRequest.changeSessionId();
        }
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        contextRepository.saveContext(context, httpRequest, httpResponse);
        sessionRegistry.registerNewSession(httpRequest.getSession().getId(), authentication.getName());
        return UserResponse.from(userService.getByEmail(authentication.getName()));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        new SecurityContextLogoutHandler().logout(request, response, authentication);
    }

    @GetMapping("/me")
    public UserResponse me(Principal principal) {
        return UserResponse.from(userService.getByEmail(principal.getName()));
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMe(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        adminUserService.deleteSelf(authentication.getName());
        new SecurityContextLogoutHandler().logout(request, response, authentication);
    }
}
