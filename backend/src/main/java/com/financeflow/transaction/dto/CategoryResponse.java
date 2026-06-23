package com.financeflow.transaction.dto;

import java.util.UUID;

public record CategoryResponse(
    UUID id,
    UUID userId,
    String name,
    UUID parentId
) {}
