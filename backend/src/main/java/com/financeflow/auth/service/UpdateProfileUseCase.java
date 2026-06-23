package com.financeflow.auth.service;

import com.financeflow.auth.dto.UpdateProfileRequest;
import com.financeflow.auth.dto.UserResponse;
import com.financeflow.auth.model.UserEntity;
import com.financeflow.auth.repository.UserRepository;
import com.financeflow.shared.exception.NotFoundException;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class UpdateProfileUseCase {

    private static final Logger log = LoggerFactory.getLogger(UpdateProfileUseCase.class);

    private final UserRepository userRepository;

    public UpdateProfileUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserResponse execute(UUID userId, UpdateProfileRequest request) {
        log.info("Updating profile for user={}", userId);

        UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User", userId));

        user.updateProfile(
            request.name(),
            request.timeZone(),
            request.currency(),
            request.budgetClosingDay()
        );

        UserEntity updated = userRepository.save(user);
        log.info("Profile updated successfully for user={}", userId);

        return new UserResponse(
            updated.getId(),
            updated.getEmail(),
            updated.getName(),
            updated.getTimeZone(),
            updated.getCurrency(),
            updated.getBudgetClosingDay()
        );
    }
}
