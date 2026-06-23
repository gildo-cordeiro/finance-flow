package com.financeflow.auth.service;

import com.financeflow.auth.dto.UserResponse;
import com.financeflow.auth.model.domain.User;
import com.financeflow.auth.model.entity.UserEntity;
import com.financeflow.auth.model.mapper.UserMapper;
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
        UserEntity entity = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User", userId));

        User user = UserMapper.toDomain(entity);

        return new UserResponse(
            user.id(),
            user.email(),
            user.name(),
            user.timeZone(),
            user.currency(),
            user.budgetClosingDay()
        );
    }
}
