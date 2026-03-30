package com.web3.freelance.exception;

/**
 * Enumeration of error codes used throughout the application.
 * Each error code represents a specific type of error that can occur.
 */
public enum ErrorCode {
    // Authentication & Authorization errors (1xxx)
    UNAUTHORIZED("1001", "Unauthorized access"),
    INVALID_CREDENTIALS("1002", "Invalid email or password"),
    TOKEN_EXPIRED("1003", "Authentication token has expired"),
    TOKEN_INVALID("1004", "Invalid authentication token"),
    INSUFFICIENT_PERMISSIONS("1005", "Insufficient permissions to perform this action"),

    // Resource errors (2xxx)
    RESOURCE_NOT_FOUND("2001", "Requested resource not found"),
    USER_NOT_FOUND("2002", "User not found"),
    JOB_NOT_FOUND("2003", "Job not found"),
    BID_NOT_FOUND("2004", "Bid not found"),
    PAYMENT_NOT_FOUND("2005", "Payment not found"),

    // Validation errors (3xxx)
    VALIDATION_ERROR("3001", "Validation failed"),
    INVALID_INPUT("3002", "Invalid input provided"),
    MISSING_REQUIRED_FIELD("3003", "Required field is missing"),
    INVALID_EMAIL_FORMAT("3004", "Invalid email format"),
    INVALID_WALLET_ADDRESS("3005", "Invalid wallet address"),

    // Duplicate resource errors (4xxx)
    DUPLICATE_RESOURCE("4001", "Resource already exists"),
    EMAIL_ALREADY_EXISTS("4002", "Email already registered"),
    USERNAME_ALREADY_EXISTS("4003", "Username already taken"),

    // Business logic errors (5xxx)
    BUSINESS_LOGIC_ERROR("5001", "Business logic error"),
    INVALID_JOB_STATUS("5002", "Invalid job status transition"),
    CANNOT_BID_OWN_JOB("5003", "Cannot bid on your own job"),
    JOB_ALREADY_ASSIGNED("5004", "Job is already assigned to another freelancer"),
    INSUFFICIENT_BALANCE("5005", "Insufficient balance for this operation"),

    // Web3 & Blockchain errors (6xxx)
    WEB3_ERROR("6001", "Web3 operation failed"),
    SMART_CONTRACT_ERROR("6002", "Smart contract execution failed"),
    TRANSACTION_FAILED("6003", "Blockchain transaction failed"),
    INVALID_TRANSACTION("6004", "Invalid transaction"),

    // System errors (9xxx)
    INTERNAL_SERVER_ERROR("9001", "Internal server error"),
    DATABASE_ERROR("9002", "Database operation failed"),
    EXTERNAL_SERVICE_ERROR("9003", "External service unavailable");

    private final String code;
    private final String message;

    ErrorCode(String code, String message) {
        this.code = code;
        this.message = message;
    }

    public String getCode() {
        return code;
    }

    public String getMessage() {
        return message;
    }
}
