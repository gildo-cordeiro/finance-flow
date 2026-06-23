package com.financeflow.transaction.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.UUID;

public record CategoryRequest(
    @NotBlank(message = "Category name cannot be blank") String name,
    UUID parentId
) {}
