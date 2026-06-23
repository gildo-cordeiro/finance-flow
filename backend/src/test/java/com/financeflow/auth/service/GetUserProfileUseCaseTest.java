package com.financeflow.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.financeflow.auth.dto.UserResponse;
import com.financeflow.auth.model.entity.UserEntity;
import com.financeflow.auth.repository.UserRepository;
import com.financeflow.shared.exception.NotFoundException;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class GetUserProfileUseCaseTest {

    private UserRepository userRepository;
    private GetUserProfileUseCase getUserProfileUseCase;

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        getUserProfileUseCase = new GetUserProfileUseCase(userRepository);
    }

    @Test
    void shouldReturnUserProfileWhenUserExists() {
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

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        UserResponse response = getUserProfileUseCase.execute(userId);

        assertThat(response.id()).isEqualTo(userId);
        assertThat(response.name()).isEqualTo("John Doe");
    }

    @Test
    void shouldThrowNotFoundExceptionWhenUserProfileDoesNotExist() {
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> getUserProfileUseCase.execute(userId))
            .isInstanceOf(NotFoundException.class)
            .hasMessageContaining("User not found");
    }
}
