package com.financeflow.shared.email

import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.springframework.boot.test.system.CapturedOutput
import org.springframework.boot.test.system.OutputCaptureExtension
import kotlin.test.assertTrue

@ExtendWith(OutputCaptureExtension::class)
class LoggingEmailSenderTest {

    @Test
    fun `registra destinatário, assunto e corpo no log`(output: CapturedOutput) {
        LoggingEmailSender().send(EmailMessage("maria@example.com", "Assunto", "http://localhost/link?token=abc"))

        assertTrue(output.all.contains("maria@example.com"))
        assertTrue(output.all.contains("Assunto"))
        assertTrue(output.all.contains("http://localhost/link?token=abc"))
    }
}
