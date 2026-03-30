package com.web3.freelance.exception;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Standardized error response structure for API responses.
 * This class provides a consistent format for error information across the application.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ErrorResponse {
    /**
     * Error code identifying the type of error
     */
    private String code;

    /**
     * Human-readable error message
     */
    private String message;

    /**
     * Timestamp when the error occurred
     */
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    /**
     * HTTP status code
     */
    private int status;

    /**
     * Request path where the error occurred
     */
    private String path;

    /**
     * Additional error details (optional)
     * Can include field-specific validation errors, stack traces in dev mode, etc.
     */
    private Map<String, Object> details;

    /**
     * Creates a simple error response with code and message
     */
    public static ErrorResponse of(ErrorCode errorCode) {
        return ErrorResponse.builder()
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .build();
    }

    /**
     * Creates an error response with custom message
     */
    public static ErrorResponse of(ErrorCode errorCode, String customMessage) {
        return ErrorResponse.builder()
                .code(errorCode.getCode())
                .message(customMessage)
                .build();
    }

    /**
     * Creates an error response with additional details
     */
    public static ErrorResponse of(ErrorCode errorCode, String customMessage, Map<String, Object> details) {
        return ErrorResponse.builder()
                .code(errorCode.getCode())
                .message(customMessage)
                .details(details)
                .build();
    }
}
