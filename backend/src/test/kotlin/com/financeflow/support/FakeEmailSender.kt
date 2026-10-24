package com.financeflow.support

import com.financeflow.shared.email.EmailMessage
import com.financeflow.shared.email.EmailSender
import org.springframework.boot.test.context.TestComponent
import org.springframework.context.annotation.Primary
import java.util.concurrent.CopyOnWriteArrayList

/** Guarda as mensagens em vez de enviar. Os testes não limpam a lista: filtre pelo destinatário. */
@TestComponent
@Primary
class FakeEmailSender : EmailSender {

    private val sent = CopyOnWriteArrayList<EmailMessage>()

    override fun send(message: EmailMessage) {
        sent += message
    }

    fun sentTo(email: String): List<EmailMessage> = sent.filter { it.to == email }
}
