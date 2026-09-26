package com.yukunxu.data4life;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class Data4LifeApplication {

    public static void main(String[] args) {
        SpringApplication.run(Data4LifeApplication.class, args);
    }
}
