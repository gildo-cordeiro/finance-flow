package com.financeflow.auth.domain

import java.time.ZoneId

object Timezone {

    const val DEFAULT = "America/Sao_Paulo"

    /** Só IDs da base IANA (`America/Manaus`); offsets fixos como `-03:00` ou `UTC-3` não acompanham mudanças de regra. */
    fun isValid(id: String): Boolean = id in ZoneId.getAvailableZoneIds()
}
