package com.web3.freelance.exception;

/**
 * Exception thrown when a user attempts to access a resource or perform an action
 * without proper authentication or authorization.
 * This typically results in a 401 Unauthorized or 403 Forbidden response.
 */
public class UnauthorizedException extends BusinessException {

    /**
     * Creates an unauthorized exception with default error code
     */
    public UnauthorizedException(String message) {
        super(ErrorCode.UNAUTHORIZED, message);
    }

    /**
     * Creates an unauthorized exception with specific error code
     */
    public UnauthorizedException(ErrorCode errorCode, String message) {
        super(errorCode, message);
    }

    /**
     * Creates an unauthorized exception with default message
     */
    public static UnauthorizedException defaultUnauthorized() {
        return new UnauthorizedException("You are not authorized to perform this action");
    }

    /**
     * Creates an unauthorized exception for invalid credentials
     */
    public static UnauthorizedException invalidCredentials() {
        return new UnauthorizedException(
                ErrorCode.INVALID_CREDENTIALS,
                "Invalid email or password"
        );
    }

    /**
     * Creates an unauthorized exception for expired token
     */
    public static UnauthorizedException tokenExpired() {
        return new UnauthorizedException(
                ErrorCode.TOKEN_EXPIRED,
                "Your session has expired. Please login again"
        );
    }

    /**
     * Creates an unauthorized exception for insufficient permissions
     */
    public static UnauthorizedException insufficientPermissions() {
        return new UnauthorizedException(
                ErrorCode.INSUFFICIENT_PERMISSIONS,
                "You do not have permission to perform this action"
        );
    }
}
