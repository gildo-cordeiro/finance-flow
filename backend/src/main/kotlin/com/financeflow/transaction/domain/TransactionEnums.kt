package com.financeflow.transaction.domain

enum class TransactionType { INCOME, EXPENSE, TRANSFER }

/** RN-06. */
enum class TransactionStatus { PLANNED, PENDING, PAID, OVERDUE }

/** RN-08: o campo existe desde a Fase 1, com padrão privada. */
enum class Visibility { PRIVATE, VISIBLE, SHARED }

enum class DateField { COMPETENCE, DUE, PAYMENT }
