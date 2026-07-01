package com.financeflow.account.repository.jpa;

import com.financeflow.account.model.domain.AccountStatus;
import com.financeflow.account.model.entity.AccountEntity;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpringAccountRepository extends JpaRepository<AccountEntity, UUID> {
    List<AccountEntity> findAllByUserIdOrderByCreatedAtDesc(UUID userId);
    List<AccountEntity> findAllByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, AccountStatus status);
}
