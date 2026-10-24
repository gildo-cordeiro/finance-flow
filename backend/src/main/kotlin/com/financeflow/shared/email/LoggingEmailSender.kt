package com.financeflow.shared.email

import org.slf4j.LoggerFactory
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty
import org.springframework.stereotype.Component

/** Só registra a mensagem no log, inclusive links com token: serve para desenvolvimento, não para produção. */
@Component
@ConditionalOnProperty(prefix = "app.email", name = ["provider"], havingValue = "log", matchIfMissing = true)
class LoggingEmailSender : EmailSender {

    private val log = LoggerFactory.getLogger(javaClass)

    override fun send(message: EmailMessage) {
        log.info("E-mail para {} | {}\n{}", message.to, message.subject, message.body)
    }
}
