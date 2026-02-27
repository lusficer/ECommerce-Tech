// File: src/main/java/com/Lusficer/OrderService/exception/InvalidOrderOperationException.java
package com.Lusficer.OrderService.exception;

public class InvalidOrderOperationException extends RuntimeException {
    public InvalidOrderOperationException(String message) {
        super(message);
    }
}