// File: src/main/java/com/Lusficer/OrderService/exception/UnauthorizedAccessException.java
package com.Lusficer.OrderService.exception;

public class UnauthorizedAccessException extends RuntimeException {
    public UnauthorizedAccessException(String message) {
        super(message);
    }
}