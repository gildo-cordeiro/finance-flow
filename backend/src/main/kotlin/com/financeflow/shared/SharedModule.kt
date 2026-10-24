package com.financeflow.shared

import org.springframework.modulith.ApplicationModule
import org.springframework.modulith.PackageInfo

/** `shared` é infraestrutura comum: todos os subpacotes podem ser usados por qualquer módulo (ADR-0034). */
@PackageInfo
@ApplicationModule(type = ApplicationModule.Type.OPEN)
class SharedModule
