package com.financeflow.auth.repository;

import com.financeflow.auth.model.entity.UserEntity;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository {
    Optional<UserEntity> findById(UUID id);
    Optional<UserEntity> findByEmail(String email);
    UserEntity save(UserEntity user);
}
