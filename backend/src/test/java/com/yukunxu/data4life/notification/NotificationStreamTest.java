package com.yukunxu.data4life.notification;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

class NotificationStreamTest {

    private final NotificationStream stream = new NotificationStream();

    @Test
    void subscribeOpensAThirtyMinuteEmitter() {
        SseEmitter emitter = stream.subscribe(1L);

        assertThat(emitter.getTimeout()).isEqualTo(30 * 60 * 1000L);
        assertThat(stream.open(1L)).containsExactly(emitter);
        assertThat(stream.open(2L)).isEmpty();
    }

    @Test
    void sendsOnlyToTheUsersEmitters() {
        Recording mine = new Recording();
        Recording other = new Recording();
        stream.add(1L, mine);
        stream.add(2L, other);

        stream.onCreated(created(1L));
        stream.ping();

        assertThat(mine.sent).hasSize(2);
        assertThat(other.sent).hasSize(1);
    }

    @Test
    void failedEmitterIsRemoved() {
        Recording working = new Recording();
        stream.add(1L, working);
        stream.add(1L, new Failing());

        stream.onCreated(created(1L));

        assertThat(stream.open(1L)).containsExactly(working);
        assertThat(working.sent).hasSize(1);

        stream.add(2L, new Failing());
        stream.ping();
        assertThat(stream.open(2L)).isEmpty();
    }

    private static NotificationCreated created(Long userId) {
        return new NotificationCreated(userId,
                new NotificationResponse(7L, NotificationType.AVAILABLE, "123", "Dune", Instant.now(), false));
    }

    private static class Recording extends SseEmitter {

        private final List<SseEventBuilder> sent = new ArrayList<>();

        @Override
        public void send(SseEventBuilder builder) {
            sent.add(builder);
        }
    }

    private static class Failing extends SseEmitter {

        @Override
        public void send(SseEventBuilder builder) throws IOException {
            throw new IOException("Broken pipe");
        }
    }
}
