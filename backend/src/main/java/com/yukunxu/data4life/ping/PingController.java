package com.yukunxu.data4life.ping;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ping")
public class PingController {

    public record PingResponse(String status) {}

    @GetMapping
    public PingResponse ping() {
        return new PingResponse("ok");
    }
}
