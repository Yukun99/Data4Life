package com.yukunxu.data4life.user;

public class EmailTakenException extends RuntimeException {

    public EmailTakenException() {
        super("An account with this email already exists");
    }
}
