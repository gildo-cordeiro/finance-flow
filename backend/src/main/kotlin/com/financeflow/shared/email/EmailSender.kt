package com.financeflow.shared.email

data class EmailMessage(val to: String, val subject: String, val body: String)

/** Envio de e-mail transacional. O provedor real entra como outra implementação, escolhida por `APP_EMAIL_PROVIDER`. */
interface EmailSender {

    fun send(message: EmailMessage)
}
