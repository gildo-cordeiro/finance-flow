package com.financeflow.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.financeflow.auth.dto.RegisterRequest;
import com.financeflow.auth.dto.UserResponse;
import com.financeflow.auth.model.UserEntity;
import com.financeflow.auth.repository.UserRepository;
import com.financeflow.shared.exception.ValidationException;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

class RegisterUseCaseTest {

    private UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private RegisterUseCase registerUseCase;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        passwordEncoder = mock(PasswordEncoder.class);
        registerUseCase = new RegisterUseCase(userRepository, passwordEncoder);
    }

    @Test
    void shouldRegisterUserSuccessfullyWhenEmailIsAvailable() {
        RegisterRequest request = new RegisterRequest(
            "test@test.com", "password123", "John Doe", "America/Sao_Paulo", "BRL", 5
        );
        when(userRepository.findByEmail(request.email())).thenReturn(Optional.empty());
        when(passwordEncoder.encode(request.password())).thenReturn("encoded-password");
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = registerUseCase.execute(request);

        assertThat(response.email()).isEqualTo(request.email());
        assertThat(response.name()).isEqualTo(request.name());
        assertThat(response.timeZone()).isEqualTo(request.timeZone());
        assertThat(response.currency()).isEqualTo(request.currency());
        assertThat(response.budgetClosingDay()).isEqualTo(request.budgetClosingDay());
        verify(userRepository, times(1)).save(any(UserEntity.class));
    }

    @Test
    void shouldThrowValidationExceptionWhenEmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest(
            "test@test.com", "password123", "John Doe", "America/Sao_Paulo", "BRL", 5
        );
        UserEntity existing = UserEntity.builder()
            .id(UUID.randomUUID())
            .email("test@test.com")
            .password("pwd")
            .name("Name")
            .timeZone("TZ")
            .currency("BRL")
            .budgetClosingDay(5)
            .build();

        when(userRepository.findByEmail(request.email())).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> registerUseCase.execute(request))
            .isInstanceOf(ValidationException.class)
            .hasMessageContaining("Email already registered");
    }
}
