package com.financeflow.auth.service;

import com.financeflow.auth.dto.UserResponse;
import com.financeflow.auth.model.UserEntity;
import com.financeflow.auth.repository.UserRepository;
import com.financeflow.shared.exception.NotFoundException;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class GetUserProfileUseCase {

    private final UserRepository userRepository;

    public GetUserProfileUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserResponse execute(UUID userId) {
        UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User", userId));

        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getName(),
            user.getTimeZone(),
            user.getCurrency(),
            user.getBudgetClosingDay()
        );
    }
}
