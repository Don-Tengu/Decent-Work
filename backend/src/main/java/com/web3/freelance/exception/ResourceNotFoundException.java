package com.web3.freelance.exception;

/**
 * Exception thrown when a requested resource is not found in the system.
 * This typically results in a 404 Not Found response.
 */
public class ResourceNotFoundException extends BusinessException {

    /**
     * Creates a resource not found exception with default error code
     */
    public ResourceNotFoundException(String message) {
        super(ErrorCode.RESOURCE_NOT_FOUND, message);
    }

    /**
     * Creates a resource not found exception with specific error code
     */
    public ResourceNotFoundException(ErrorCode errorCode, String message) {
        super(errorCode, message);
    }

    /**
     * Creates a resource not found exception for a specific resource type and ID
     */
    public static ResourceNotFoundException forResource(String resourceType, Long id) {
        return new ResourceNotFoundException(
                String.format("%s with ID %d not found", resourceType, id)
        );
    }

    /**
     * Creates a resource not found exception for a specific resource type and identifier
     */
    public static ResourceNotFoundException forResource(String resourceType, String identifier) {
        return new ResourceNotFoundException(
                String.format("%s with identifier '%s' not found", resourceType, identifier)
        );
    }
}
