package com.web3.freelance.exception;

import graphql.GraphQLError;
import graphql.GraphqlErrorBuilder;
import graphql.schema.DataFetchingEnvironment;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.graphql.data.method.annotation.GraphQlExceptionHandler;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.ControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * Global exception handler for GraphQL operations.
 * This class intercepts exceptions thrown during GraphQL query/mutation execution
 * and converts them into properly formatted GraphQL errors.
 */
@Slf4j
@ControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles business logic exceptions
     */
    @GraphQlExceptionHandler
    public GraphQLError handleBusinessException(BusinessException ex, DataFetchingEnvironment env) {
        log.error("Business exception occurred: {}", ex.getMessage(), ex);

        Map<String, Object> extensions = new HashMap<>();
        extensions.put("errorCode", ex.getErrorCode().getCode());
        extensions.put("timestamp", System.currentTimeMillis());

        return GraphqlErrorBuilder.newError(env)
                .message(ex.getMessage())
                .errorType(ErrorType.BAD_REQUEST)
                .extensions(extensions)
                .build();
    }

    /**
     * Handles resource not found exceptions
     */
    @GraphQlExceptionHandler
    public GraphQLError handleResourceNotFoundException(ResourceNotFoundException ex, DataFetchingEnvironment env) {
        log.warn("Resource not found: {}", ex.getMessage());

        Map<String, Object> extensions = new HashMap<>();
        extensions.put("errorCode", ex.getErrorCode().getCode());
        extensions.put("timestamp", System.currentTimeMillis());

        return GraphqlErrorBuilder.newError(env)
                .message(ex.getMessage())
                .errorType(ErrorType.NOT_FOUND)
                .extensions(extensions)
                .build();
    }

    /**
     * Handles validation exceptions with field-specific errors
     */
    @GraphQlExceptionHandler
    public GraphQLError handleValidationException(ValidationException ex, DataFetchingEnvironment env) {
        log.warn("Validation error: {}", ex.getMessage());

        Map<String, Object> extensions = new HashMap<>();
        extensions.put("errorCode", ex.getErrorCode().getCode());
        extensions.put("timestamp", System.currentTimeMillis());

        // Include field-specific validation errors if present
        if (!ex.getFieldErrors().isEmpty()) {
            extensions.put("fieldErrors", ex.getFieldErrors());
        }

        return GraphqlErrorBuilder.newError(env)
                .message(ex.getMessage())
                .errorType(ErrorType.BAD_REQUEST)
                .extensions(extensions)
                .build();
    }

    /**
     * Handles duplicate resource exceptions
     */
    @GraphQlExceptionHandler
    public GraphQLError handleDuplicateResourceException(DuplicateResourceException ex, DataFetchingEnvironment env) {
        log.warn("Duplicate resource: {}", ex.getMessage());

        Map<String, Object> extensions = new HashMap<>();
        extensions.put("errorCode", ex.getErrorCode().getCode());
        extensions.put("timestamp", System.currentTimeMillis());

        return GraphqlErrorBuilder.newError(env)
                .message(ex.getMessage())
                .errorType(ErrorType.BAD_REQUEST)
                .extensions(extensions)
                .build();
    }

    /**
     * Handles unauthorized access exceptions
     */
    @GraphQlExceptionHandler
    public GraphQLError handleUnauthorizedException(UnauthorizedException ex, DataFetchingEnvironment env) {
        log.warn("Unauthorized access: {}", ex.getMessage());

        Map<String, Object> extensions = new HashMap<>();
        extensions.put("errorCode", ex.getErrorCode().getCode());
        extensions.put("timestamp", System.currentTimeMillis());

        return GraphqlErrorBuilder.newError(env)
                .message(ex.getMessage())
                .errorType(ErrorType.UNAUTHORIZED)
                .extensions(extensions)
                .build();
    }

    /**
     * Handles Spring Security authentication exceptions
     */
    @GraphQlExceptionHandler
    public GraphQLError handleAuthenticationException(AuthenticationException ex, DataFetchingEnvironment env) {
        log.warn("Authentication failed: {}", ex.getMessage());

        Map<String, Object> extensions = new HashMap<>();
        extensions.put("errorCode", ErrorCode.UNAUTHORIZED.getCode());
        extensions.put("timestamp", System.currentTimeMillis());

        return GraphqlErrorBuilder.newError(env)
                .message("Authentication failed: " + ex.getMessage())
                .errorType(ErrorType.UNAUTHORIZED)
                .extensions(extensions)
                .build();
    }

    /**
     * Handles Spring Security access denied exceptions
     */
    @GraphQlExceptionHandler
    public GraphQLError handleAccessDeniedException(AccessDeniedException ex, DataFetchingEnvironment env) {
        log.warn("Access denied: {}", ex.getMessage());

        Map<String, Object> extensions = new HashMap<>();
        extensions.put("errorCode", ErrorCode.INSUFFICIENT_PERMISSIONS.getCode());
        extensions.put("timestamp", System.currentTimeMillis());

        return GraphqlErrorBuilder.newError(env)
                .message("Access denied: You don't have permission to perform this action")
                .errorType(ErrorType.FORBIDDEN)
                .extensions(extensions)
                .build();
    }

    /**
     * Handles bad credentials exceptions (invalid login)
     */
    @GraphQlExceptionHandler
    public GraphQLError handleBadCredentialsException(BadCredentialsException ex, DataFetchingEnvironment env) {
        log.warn("Bad credentials: {}", ex.getMessage());

        Map<String, Object> extensions = new HashMap<>();
        extensions.put("errorCode", ErrorCode.INVALID_CREDENTIALS.getCode());
        extensions.put("timestamp", System.currentTimeMillis());

        return GraphqlErrorBuilder.newError(env)
                .message("Invalid email or password")
                .errorType(ErrorType.UNAUTHORIZED)
                .extensions(extensions)
                .build();
    }

    /**
     * Handles JWT token expiration
     */
    @GraphQlExceptionHandler
    public GraphQLError handleExpiredJwtException(ExpiredJwtException ex, DataFetchingEnvironment env) {
        log.warn("JWT token expired: {}", ex.getMessage());

        Map<String, Object> extensions = new HashMap<>();
        extensions.put("errorCode", ErrorCode.TOKEN_EXPIRED.getCode());
        extensions.put("timestamp", System.currentTimeMillis());

        return GraphqlErrorBuilder.newError(env)
                .message("Your session has expired. Please login again")
                .errorType(ErrorType.UNAUTHORIZED)
                .extensions(extensions)
                .build();
    }

    /**
     * Handles invalid JWT token
     */
    @GraphQlExceptionHandler
    public GraphQLError handleJwtException(JwtException ex, DataFetchingEnvironment env) {
        log.warn("Invalid JWT token: {}", ex.getMessage());

        Map<String, Object> extensions = new HashMap<>();
        extensions.put("errorCode", ErrorCode.TOKEN_INVALID.getCode());
        extensions.put("timestamp", System.currentTimeMillis());

        return GraphqlErrorBuilder.newError(env)
                .message("Invalid authentication token")
                .errorType(ErrorType.UNAUTHORIZED)
                .extensions(extensions)
                .build();
    }

    /**
     * Handles database constraint violations (e.g., unique constraint)
     */
    @GraphQlExceptionHandler
    public GraphQLError handleDataIntegrityViolationException(DataIntegrityViolationException ex, DataFetchingEnvironment env) {
        log.error("Data integrity violation: {}", ex.getMessage(), ex);

        Map<String, Object> extensions = new HashMap<>();
        extensions.put("errorCode", ErrorCode.DATABASE_ERROR.getCode());
        extensions.put("timestamp", System.currentTimeMillis());

        // Try to provide a more user-friendly message
        String message = "Database constraint violation";
        if (ex.getMessage() != null) {
            if (ex.getMessage().contains("unique") || ex.getMessage().contains("duplicate")) {
                message = "A record with this information already exists";
            }
        }

        return GraphqlErrorBuilder.newError(env)
                .message(message)
                .errorType(ErrorType.BAD_REQUEST)
                .extensions(extensions)
                .build();
    }

    /**
     * Handles illegal argument exceptions
     */
    @GraphQlExceptionHandler
    public GraphQLError handleIllegalArgumentException(IllegalArgumentException ex, DataFetchingEnvironment env) {
        log.warn("Illegal argument: {}", ex.getMessage());

        Map<String, Object> extensions = new HashMap<>();
        extensions.put("errorCode", ErrorCode.INVALID_INPUT.getCode());
        extensions.put("timestamp", System.currentTimeMillis());

        return GraphqlErrorBuilder.newError(env)
                .message("Invalid input: " + ex.getMessage())
                .errorType(ErrorType.BAD_REQUEST)
                .extensions(extensions)
                .build();
    }

    /**
     * Handles all other unexpected exceptions
     * This is the catch-all handler for any exception not specifically handled above
     */
    @GraphQlExceptionHandler
    public GraphQLError handleGenericException(Exception ex, DataFetchingEnvironment env) {
        log.error("Unexpected error occurred: {}", ex.getMessage(), ex);

        Map<String, Object> extensions = new HashMap<>();
        extensions.put("errorCode", ErrorCode.INTERNAL_SERVER_ERROR.getCode());
        extensions.put("timestamp", System.currentTimeMillis());

        // In production, don't expose internal error details
        // In development, you might want to include more information
        String message = "An unexpected error occurred. Please try again later";

        return GraphqlErrorBuilder.newError(env)
                .message(message)
                .errorType(ErrorType.INTERNAL_ERROR)
                .extensions(extensions)
                .build();
    }
}
