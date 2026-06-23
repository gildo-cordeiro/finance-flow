package com.financeflow.auth.service;

import com.financeflow.auth.dto.RegisterRequest;
import com.financeflow.auth.dto.UserResponse;
import com.financeflow.auth.model.domain.User;
import com.financeflow.auth.model.entity.UserEntity;
import com.financeflow.auth.model.mapper.UserMapper;
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

        User domainUser = new User(
            UUID.randomUUID(),
            request.email(),
            encodedPassword,
            request.name(),
            request.timeZone(),
            request.currency(),
            request.budgetClosingDay(),
            null,
            null
        );

        UserEntity userEntity = UserMapper.toEntity(domainUser);
        UserEntity saved = userRepository.save(userEntity);
        log.info("User registered successfully with id={}", saved.getId());

        User savedDomain = UserMapper.toDomain(saved);

        return new UserResponse(
            savedDomain.id(),
            savedDomain.email(),
            savedDomain.name(),
            savedDomain.timeZone(),
            savedDomain.currency(),
            savedDomain.budgetClosingDay()
        );
    }
}
