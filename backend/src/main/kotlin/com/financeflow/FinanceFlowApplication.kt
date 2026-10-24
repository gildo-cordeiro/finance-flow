package com.financeflow

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.context.properties.ConfigurationPropertiesScan
import org.springframework.boot.runApplication

@SpringBootApplication
@ConfigurationPropertiesScan
class FinanceFlowApplication

fun main(args: Array<String>) {
    runApplication<FinanceFlowApplication>(*args)
}
