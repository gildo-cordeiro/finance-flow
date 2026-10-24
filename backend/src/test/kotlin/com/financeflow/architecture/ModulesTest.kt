package com.financeflow.architecture

import com.financeflow.FinanceFlowApplication
import org.junit.jupiter.api.Test
import org.springframework.modulith.core.ApplicationModules

/** Um módulo só usa o pacote raiz de outro (a API pública), sem ciclos (ADR-0001, ADR-0034). */
class ModulesTest {

    @Test
    fun `módulos respeitam as fronteiras entre si`() {
        ApplicationModules.of(FinanceFlowApplication::class.java).verify()
    }
}
