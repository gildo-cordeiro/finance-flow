package com.financeflow.account.repository;

import com.financeflow.account.model.entity.AccountEntity;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccountRepository {
    List<AccountEntity> findAllByUserId(UUID userId);
    Optional<AccountEntity> findById(UUID id);
    AccountEntity save(AccountEntity account);
}
