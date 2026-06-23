package com.financeflow.auth.service;

import com.financeflow.auth.dto.UpdateProfileRequest;
import com.financeflow.auth.dto.UserResponse;
import com.financeflow.auth.model.domain.User;
import com.financeflow.auth.model.entity.UserEntity;
import com.financeflow.auth.model.mapper.UserMapper;
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

        UserEntity entity = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User", userId));

        User domainUser = UserMapper.toDomain(entity);
        User updatedUser = domainUser.updateProfile(
            request.name(),
            request.timeZone(),
            request.currency(),
            request.budgetClosingDay()
        );

        UserEntity updatedEntity = UserMapper.toEntity(updatedUser);
        UserEntity saved = userRepository.save(updatedEntity);
        log.info("Profile updated successfully for user={}", userId);

        User finalDomain = UserMapper.toDomain(saved);

        return new UserResponse(
            finalDomain.id(),
            finalDomain.email(),
            finalDomain.name(),
            finalDomain.timeZone(),
            finalDomain.currency(),
            finalDomain.budgetClosingDay()
        );
    }
}
