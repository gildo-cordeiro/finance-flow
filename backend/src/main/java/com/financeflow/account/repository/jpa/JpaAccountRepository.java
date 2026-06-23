package com.financeflow.account.repository.jpa;

import com.financeflow.account.model.entity.AccountEntity;
import com.financeflow.account.repository.AccountRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Repository;

@Repository
public class JpaAccountRepository implements AccountRepository {

    private final SpringAccountRepository springRepo;

    public JpaAccountRepository(SpringAccountRepository springRepo) {
        this.springRepo = springRepo;
    }

    @Override
    public List<AccountEntity> findAllByUserId(UUID userId) {
        return springRepo.findAllByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public Optional<AccountEntity> findById(UUID id) {
        return springRepo.findById(id);
    }

    @Override
    public AccountEntity save(AccountEntity account) {
        return springRepo.save(account);
    }
}
