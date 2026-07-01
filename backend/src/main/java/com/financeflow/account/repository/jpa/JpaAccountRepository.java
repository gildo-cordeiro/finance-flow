package com.financeflow.account.repository.jpa;

import com.financeflow.account.model.domain.AccountStatus;
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
    public List<AccountEntity> findAllByUserIdAndStatus(UUID userId, AccountStatus status) {
        return springRepo.findAllByUserIdAndStatusOrderByCreatedAtDesc(userId, status);
    }

    @Override
    public Optional<AccountEntity> findById(UUID id) {
        return springRepo.findById(id);
    }

    @Override
    public AccountEntity save(AccountEntity account) {
        return springRepo.save(account);
    }

    @Override
    public void delete(AccountEntity account) {
        springRepo.delete(account);
    }
}
