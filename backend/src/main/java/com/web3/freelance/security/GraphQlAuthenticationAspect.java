package com.web3.freelance.security;

import com.web3.freelance.controller.AuthController;
import com.web3.freelance.exception.ErrorCode;
import com.web3.freelance.exception.UnauthorizedException;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Aspect
@Component
@RequiredArgsConstructor
public class GraphQlAuthenticationAspect {

    @Around("@annotation(org.springframework.graphql.data.method.annotation.QueryMapping) || " +
            "@annotation(org.springframework.graphql.data.method.annotation.MutationMapping)")
    public Object requireAuthentication(ProceedingJoinPoint joinPoint) throws Throwable {
        if (joinPoint.getTarget() instanceof AuthController) {
            return joinPoint.proceed();
        }

        HttpServletRequest request = currentRequest();
        ErrorCode tokenErrorCode = resolveTokenErrorCode(request);

        if (tokenErrorCode != null) {
            throw authException(tokenErrorCode);
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw authException(ErrorCode.UNAUTHORIZED);
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !authentication.isAuthenticated()
                || authentication instanceof AnonymousAuthenticationToken) {
            throw authException(ErrorCode.UNAUTHORIZED);
        }

        return joinPoint.proceed();
    }

    private HttpServletRequest currentRequest() {
        if (RequestContextHolder.getRequestAttributes() instanceof ServletRequestAttributes attributes) {
            return attributes.getRequest();
        }

        throw authException(ErrorCode.UNAUTHORIZED);
    }

    private ErrorCode resolveTokenErrorCode(HttpServletRequest request) {
        Object errorCode = request.getAttribute(JwtAuthenticationFilter.AUTH_ERROR_CODE_ATTRIBUTE);

        if (ErrorCode.TOKEN_EXPIRED.getCode().equals(errorCode)) {
            return ErrorCode.TOKEN_EXPIRED;
        }

        if (ErrorCode.TOKEN_INVALID.getCode().equals(errorCode)) {
            return ErrorCode.TOKEN_INVALID;
        }

        return null;
    }

    private UnauthorizedException authException(ErrorCode errorCode) {
        return new UnauthorizedException(errorCode, authMessage(errorCode));
    }

    private String authMessage(ErrorCode errorCode) {
        return switch (errorCode) {
            case TOKEN_EXPIRED -> "Your session has expired. Please login again";
            case TOKEN_INVALID -> "Invalid authentication token";
            case UNAUTHORIZED -> "Authentication is required";
            default -> errorCode.getMessage();
        };
    }
}
