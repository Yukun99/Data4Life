package com.yukunxu.data4life.notification;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.request;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.yukunxu.data4life.catalogue.BookRepository;
import com.yukunxu.data4life.loan.Loan;
import com.yukunxu.data4life.loan.LoanRepository;
import com.yukunxu.data4life.user.User;
import com.yukunxu.data4life.user.UserRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.event.ApplicationEvents;
import org.springframework.test.context.event.RecordApplicationEvents;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@RecordApplicationEvents
class NotificationFlowTest {

    private static final String DUNE = "9780441172719";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private BookRepository bookRepository;

    @Autowired
    private LoanRepository loanRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private ApplicationEvents events;

    private MockHttpSession session;
    private User user;
    private Loan loan;

    @BeforeEach
    void setUp() throws Exception {
        session = signUpAndLogin("ada@example.com");
        user = userRepository.findByEmail("ada@example.com").orElseThrow();
        loan = loanRepository.save(Loan.queued(user, bookRepository.findById(DUNE).orElseThrow(), Instant.now()));
    }

    @Test
    void sendSavesAndPublishes() throws Exception {
        notificationService.send(loan, NotificationType.AVAILABLE);

        assertThat(events.stream(NotificationCreated.class)).singleElement().satisfies(event -> {
            assertThat(event.userId()).isEqualTo(user.getId());
            assertThat(event.notification().type()).isEqualTo(NotificationType.AVAILABLE);
            assertThat(event.notification().isbn()).isEqualTo(DUNE);
            assertThat(event.notification().title()).isEqualTo("Dune");
            assertThat(event.notification().read()).isFalse();
        });
        list()
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].id").value(event().notification().id()))
                .andExpect(jsonPath("$.items[0].type").value("AVAILABLE"))
                .andExpect(jsonPath("$.items[0].isbn").value(DUNE))
                .andExpect(jsonPath("$.items[0].title").value("Dune"))
                .andExpect(jsonPath("$.items[0].createdAt").isString())
                .andExpect(jsonPath("$.items[0].read").value(false))
                .andExpect(jsonPath("$.hasMore").value(false));
    }

    @Test
    void pagesNewestFirstWithACursor() throws Exception {
        List<Notification> saved = save(user, 25);

        list()
                .andExpect(jsonPath("$.items.length()").value(20))
                .andExpect(jsonPath("$.items[0].id").value(saved.get(24).getId()))
                .andExpect(jsonPath("$.items[19].id").value(saved.get(5).getId()))
                .andExpect(jsonPath("$.hasMore").value(true));
        list("before", String.valueOf(saved.get(5).getId()))
                .andExpect(jsonPath("$.items.length()").value(5))
                .andExpect(jsonPath("$.items[0].id").value(saved.get(4).getId()))
                .andExpect(jsonPath("$.items[4].id").value(saved.get(0).getId()))
                .andExpect(jsonPath("$.hasMore").value(false));
        list("before", String.valueOf(saved.get(0).getId()))
                .andExpect(jsonPath("$.items.length()").value(0))
                .andExpect(jsonPath("$.hasMore").value(false));
    }

    @Test
    void unreadCountAndMarkingRead() throws Exception {
        List<Notification> saved = save(user, 3);
        mockMvc.perform(get("/api/notifications/unread").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(3));

        read(saved.get(1).getId()).andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(2));
        read(saved.get(1).getId()).andExpect(jsonPath("$.count").value(2));
        list()
                .andExpect(jsonPath("$.items[0].read").value(false))
                .andExpect(jsonPath("$.items[1].read").value(true))
                .andExpect(jsonPath("$.items[2].read").value(false));

        mockMvc.perform(post("/api/notifications/read-all").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0));
        list()
                .andExpect(jsonPath("$.items[0].read").value(true))
                .andExpect(jsonPath("$.items[2].read").value(true));
    }

    @Test
    void deleteOneAndAll() throws Exception {
        List<Notification> saved = save(user, 3);

        mockMvc.perform(delete("/api/notifications/{id}", saved.get(0).getId()).session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(2));
        list().andExpect(jsonPath("$.items.length()").value(2));

        mockMvc.perform(delete("/api/notifications").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0));
        list().andExpect(jsonPath("$.items.length()").value(0));
    }

    @Test
    void otherUsersNotificationIsNotFound() throws Exception {
        User bob = userRepository.save(new User("bob@example.com", "Bob", "hash"));
        Loan bobLoan = loanRepository.save(Loan.queued(bob, bookRepository.findById(DUNE).orElseThrow(),
                Instant.now()));
        Notification other = notificationRepository.save(
                new Notification(bob, bobLoan, NotificationType.AVAILABLE, Instant.now()));

        read(other.getId()).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Notification not found"));
        mockMvc.perform(delete("/api/notifications/{id}", other.getId()).session(session))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Notification not found"));
        list().andExpect(jsonPath("$.items.length()").value(0));
        mockMvc.perform(delete("/api/notifications").session(session)).andExpect(status().isOk());
        assertThat(notificationRepository.findById(other.getId())).isPresent();
    }

    @Test
    void streamStartsAsync() throws Exception {
        mockMvc.perform(get("/api/notifications/stream").session(session))
                .andExpect(status().isOk())
                .andExpect(request().asyncStarted())
                .andExpect(header().string("X-Accel-Buffering", "no"));
    }

    @Test
    void withoutSessionIsUnauthorized() throws Exception {
        MockHttpServletRequestBuilder[] routes = {
            get("/api/notifications"),
            get("/api/notifications/unread"),
            post("/api/notifications/{id}/read", 1),
            post("/api/notifications/read-all"),
            delete("/api/notifications/{id}", 1),
            delete("/api/notifications"),
            get("/api/notifications/stream"),
        };
        for (MockHttpServletRequestBuilder request : routes) {
            mockMvc.perform(request).andExpect(status().isUnauthorized());
        }
    }

    private NotificationCreated event() {
        return events.stream(NotificationCreated.class).findFirst().orElseThrow();
    }

    private List<Notification> save(User owner, int count) {
        List<Notification> saved = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            saved.add(notificationRepository.save(
                    new Notification(owner, loan, NotificationType.AVAILABLE, Instant.now())));
        }
        return saved;
    }

    private ResultActions list(String... params) throws Exception {
        MockHttpServletRequestBuilder request = get("/api/notifications").session(session);
        for (int i = 0; i < params.length; i += 2) {
            request.param(params[i], params[i + 1]);
        }
        return mockMvc.perform(request);
    }

    private ResultActions read(Long id) throws Exception {
        return mockMvc.perform(post("/api/notifications/{id}/read", id).session(session));
    }

    private MockHttpSession signUpAndLogin(String email) throws Exception {
        mockMvc.perform(post("/api/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name": "Ada", "email": "%s", "password": "secret123"}
                                """.formatted(email)))
                .andExpect(status().isCreated());
        return (MockHttpSession) mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s", "password": "secret123"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn().getRequest().getSession();
    }
}
