package com.financeflow.auth.service;

import com.financeflow.auth.model.entity.UserEntity;
import com.financeflow.auth.repository.UserRepository;
import com.financeflow.shared.exception.NotFoundException;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DeleteUserUseCase {

    private static final Logger log = LoggerFactory.getLogger(DeleteUserUseCase.class);

    private final UserRepository userRepository;

    public DeleteUserUseCase(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void execute(UUID userId) {
        log.info("Deleting user account with id={}", userId);

        UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User", userId));

        userRepository.delete(user);

        log.info("User account deleted successfully with id={}", userId);
    }
}
