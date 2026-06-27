package com.financeflow.transaction.dto;

import com.financeflow.transaction.model.domain.TransactionVisibility;
import java.util.UUID;

public record CategoryResponse(
    UUID id,
    UUID userId,
    String name,
    UUID parentId,
    TransactionVisibility visibility
) {}
