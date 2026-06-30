package com.financeflow.auth.repository.jpa;

import com.financeflow.auth.model.entity.UserEntity;
import com.financeflow.auth.repository.UserRepository;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class JpaUserRepository implements UserRepository {

    private final SpringUserRepository springRepo;

    public JpaUserRepository(SpringUserRepository springRepo) {
        this.springRepo = springRepo;
    }

    @Override
    public Optional<UserEntity> findById(UUID id) {
        return springRepo.findById(id);
    }

    @Override
    public Optional<UserEntity> findByEmail(String email) {
        return springRepo.findByEmail(email);
    }

    @Override
    public UserEntity save(UserEntity user) {
        return springRepo.save(user);
    }

    @Override
    public void delete(UserEntity user) {
        springRepo.delete(user);
    }
}
