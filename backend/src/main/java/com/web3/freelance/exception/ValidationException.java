package com.web3.freelance.exception;

import java.util.HashMap;
import java.util.Map;

/**
 * Exception thrown when input validation fails.
 * This typically results in a 400 Bad Request response.
 */
public class ValidationException extends BusinessException {
    private final Map<String, String> fieldErrors;

    /**
     * Creates a validation exception with a general message
     */
    public ValidationException(String message) {
        super(ErrorCode.VALIDATION_ERROR, message);
        this.fieldErrors = new HashMap<>();
    }

    /**
     * Creates a validation exception with field-specific errors
     */
    public ValidationException(String message, Map<String, String> fieldErrors) {
        super(ErrorCode.VALIDATION_ERROR, message);
        this.fieldErrors = fieldErrors != null ? fieldErrors : new HashMap<>();
    }

    /**
     * Creates a validation exception with specific error code
     */
    public ValidationException(ErrorCode errorCode, String message) {
        super(errorCode, message);
        this.fieldErrors = new HashMap<>();
    }

    /**
     * Gets field-specific validation errors
     */
    public Map<String, String> getFieldErrors() {
        return fieldErrors;
    }

    /**
     * Adds a field error to the validation exception
     */
    public ValidationException addFieldError(String field, String error) {
        this.fieldErrors.put(field, error);
        return this;
    }

    /**
     * Creates a validation exception for a missing required field
     */
    public static ValidationException missingField(String fieldName) {
        return new ValidationException(
                ErrorCode.MISSING_REQUIRED_FIELD,
                String.format("Required field '%s' is missing", fieldName)
        );
    }

    /**
     * Creates a validation exception for invalid input
     */
    public static ValidationException invalidInput(String message) {
        return new ValidationException(ErrorCode.INVALID_INPUT, message);
    }
}
