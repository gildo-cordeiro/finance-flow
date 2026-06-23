package com.financeflow.auth.service;

import com.financeflow.auth.dto.RegisterRequest;
import com.financeflow.auth.dto.UserResponse;
import com.financeflow.auth.model.UserEntity;
import com.financeflow.auth.repository.UserRepository;
import com.financeflow.shared.exception.ValidationException;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class RegisterUseCase {

    private static final Logger log = LoggerFactory.getLogger(RegisterUseCase.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public RegisterUseCase(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public UserResponse execute(RegisterRequest request) {
        log.info("Registering new user with email={}", request.email());

        if (userRepository.findByEmail(request.email()).isPresent()) {
            throw new ValidationException("email", "Email already registered");
        }

        String encodedPassword = passwordEncoder.encode(request.password());

        UserEntity user = UserEntity.builder()
            .id(UUID.randomUUID())
            .email(request.email())
            .password(encodedPassword)
            .name(request.name())
            .timeZone(request.timeZone())
            .currency(request.currency())
            .budgetClosingDay(request.budgetClosingDay())
            .build();

        UserEntity saved = userRepository.save(user);
        log.info("User registered successfully with id={}", saved.getId());

        return new UserResponse(
            saved.getId(),
            saved.getEmail(),
            saved.getName(),
            saved.getTimeZone(),
            saved.getCurrency(),
            saved.getBudgetClosingDay()
        );
    }
}
