package com.financeflow.auth.service;

import com.financeflow.auth.dto.ChangePasswordRequest;
import com.financeflow.auth.model.entity.UserEntity;
import com.financeflow.auth.repository.UserRepository;
import com.financeflow.shared.exception.NotFoundException;
import com.financeflow.shared.exception.ValidationException;
import java.time.Instant;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ChangePasswordUseCase {

    private static final Logger log = LoggerFactory.getLogger(ChangePasswordUseCase.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ChangePasswordUseCase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public void execute(UUID userId, ChangePasswordRequest request) {
        log.info("Changing password for user id={}", userId);

        UserEntity user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User", userId));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new ValidationException("currentPassword", "Incorrect current password");
        }

        user.setPassword(passwordEncoder.encode(request.newPassword()));
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);

        log.info("Password changed successfully for user id={}", userId);
    }
}
