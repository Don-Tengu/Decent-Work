package com.web3.freelance.exception;

/**
 * Exception thrown when attempting to create a resource that already exists.
 * This typically results in a 409 Conflict response.
 */
public class DuplicateResourceException extends BusinessException {

    /**
     * Creates a duplicate resource exception with default error code
     */
    public DuplicateResourceException(String message) {
        super(ErrorCode.DUPLICATE_RESOURCE, message);
    }

    /**
     * Creates a duplicate resource exception with specific error code
     */
    public DuplicateResourceException(ErrorCode errorCode, String message) {
        super(errorCode, message);
    }

    /**
     * Creates a duplicate resource exception for email
     */
    public static DuplicateResourceException emailExists(String email) {
        return new DuplicateResourceException(
                ErrorCode.EMAIL_ALREADY_EXISTS,
                String.format("Email '%s' is already registered", email)
        );
    }

    /**
     * Creates a duplicate resource exception for username
     */
    public static DuplicateResourceException usernameExists(String username) {
        return new DuplicateResourceException(
                ErrorCode.USERNAME_ALREADY_EXISTS,
                String.format("Username '%s' is already taken", username)
        );
    }

    /**
     * Creates a duplicate resource exception for a generic resource
     */
    public static DuplicateResourceException forResource(String resourceType, String identifier) {
        return new DuplicateResourceException(
                String.format("%s with identifier '%s' already exists", resourceType, identifier)
        );
    }
}
