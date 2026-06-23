package com.financeflow.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.financeflow.auth.dto.UpdateProfileRequest;
import com.financeflow.auth.dto.UserResponse;
import com.financeflow.auth.model.entity.UserEntity;
import com.financeflow.auth.repository.UserRepository;
import com.financeflow.shared.exception.NotFoundException;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class UpdateProfileUseCaseTest {

    private UserRepository userRepository;
    private UpdateProfileUseCase updateProfileUseCase;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        updateProfileUseCase = new UpdateProfileUseCase(userRepository);
    }

    @Test
    void shouldUpdateProfileSuccessfullyWhenUserExists() {
        UUID userId = UUID.randomUUID();
        UserEntity user = new UserEntity(
            userId,
            "test@test.com",
            "pwd",
            "John Doe",
            "TZ",
            "BRL",
            5,
            Instant.now(),
            Instant.now()
        );

        UpdateProfileRequest request = new UpdateProfileRequest(
            "Jane Doe", "UTC", "USD", 10
        );

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(UserEntity.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserResponse response = updateProfileUseCase.execute(userId, request);

        assertThat(response.name()).isEqualTo("Jane Doe");
        assertThat(response.timeZone()).isEqualTo("UTC");
        assertThat(response.currency()).isEqualTo("USD");
        assertThat(response.budgetClosingDay()).isEqualTo(10);
    }

    @Test
    void shouldThrowNotFoundExceptionWhenUserToUpdateDoesNotExist() {
        UUID userId = UUID.randomUUID();
        UpdateProfileRequest request = new UpdateProfileRequest("Jane Doe", "UTC", "USD", 10);
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> updateProfileUseCase.execute(userId, request))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("User not found");
    }
}
