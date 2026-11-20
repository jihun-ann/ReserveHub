package com.hub.reservehub.common.exception;

// 요청한 대상이 없을 때 — GlobalExceptionHandler가 404로 바꾼다.
public class NotFoundException extends RuntimeException {

    public NotFoundException() {
        super("요청한 대상을 찾을 수 없습니다.");
    }
}
