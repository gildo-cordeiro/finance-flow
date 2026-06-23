package com.financeflow.auth.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class JwtServiceTest {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        com.financeflow.auth.config.JwtProperties properties = new com.financeflow.auth.config.JwtProperties();
        properties.setSecret("financeflow-test-secret-key-that-is-very-long-and-secure-for-development");
        properties.setExpirationMs(5000);
        jwtService = new JwtService(properties);
    }

    @Test
    void shouldGenerateValidToken() {
        String userId = UUID.randomUUID().toString();
        String token = jwtService.generateAccessToken(userId);

        assertThat(token).isNotBlank();
        assertThat(jwtService.isTokenValid(token)).isTrue();
        assertThat(jwtService.extractUserId(token)).isEqualTo(userId);
    }

    @Test
    void shouldReturnFalseForInvalidToken() {
        assertThat(jwtService.isTokenValid("invalid.token.signature")).isFalse();
    }

    @Test
    void shouldReturnFalseForExpiredToken() throws InterruptedException {
        com.financeflow.auth.config.JwtProperties properties = new com.financeflow.auth.config.JwtProperties();
        properties.setSecret("financeflow-test-secret-key-that-is-very-long-and-secure-for-development");
        properties.setExpirationMs(1);
        JwtService shortLivedService = new JwtService(properties);

        String userId = UUID.randomUUID().toString();
        String token = shortLivedService.generateAccessToken(userId);

        // Sleep to ensure it expires
        Thread.sleep(10);

        assertThat(shortLivedService.isTokenValid(token)).isFalse();
    }
}
