package com.web3.freelance.security;

import com.web3.freelance.exception.ErrorCode;
import com.web3.freelance.service.JwtService;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    public static final String AUTH_ERROR_CODE_ATTRIBUTE = "authErrorCode";

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        jwt = authHeader.substring(7);
        try {
            userEmail = jwtService.extractUsername(jwt);
        } catch (ExpiredJwtException ex) {
            markAuthFailure(request, ErrorCode.TOKEN_EXPIRED);
            filterChain.doFilter(request, response);
            return;
        } catch (JwtException | IllegalArgumentException ex) {
            markAuthFailure(request, ErrorCode.TOKEN_INVALID);
            filterChain.doFilter(request, response);
            return;
        }

        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails;

            try {
                userDetails = this.userDetailsService.loadUserByUsername(userEmail);
            } catch (UsernameNotFoundException ex) {
                markAuthFailure(request, ErrorCode.TOKEN_INVALID);
                filterChain.doFilter(request, response);
                return;
            }

            if (isTokenValid(jwt, userDetails.getUsername(), request)) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        userDetails,
                        null,
                        userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isTokenValid(String jwt, String username, HttpServletRequest request) {
        try {
            return jwtService.isTokenValid(jwt, username);
        } catch (ExpiredJwtException ex) {
            markAuthFailure(request, ErrorCode.TOKEN_EXPIRED);
            return false;
        } catch (JwtException | IllegalArgumentException ex) {
            markAuthFailure(request, ErrorCode.TOKEN_INVALID);
            return false;
        }
    }

    private void markAuthFailure(HttpServletRequest request, ErrorCode errorCode) {
        SecurityContextHolder.clearContext();
        request.setAttribute(AUTH_ERROR_CODE_ATTRIBUTE, errorCode.getCode());
    }
}
