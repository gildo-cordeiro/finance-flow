package com.financeflow.shared.config

import com.financeflow.shared.error.DocumentedError
import io.swagger.v3.oas.annotations.security.SecurityRequirements
import io.swagger.v3.oas.models.Components
import io.swagger.v3.oas.models.OpenAPI
import io.swagger.v3.oas.models.info.Info
import io.swagger.v3.oas.models.media.ArraySchema
import io.swagger.v3.oas.models.media.Content
import io.swagger.v3.oas.models.media.IntegerSchema
import io.swagger.v3.oas.models.media.MediaType
import io.swagger.v3.oas.models.media.ObjectSchema
import io.swagger.v3.oas.models.media.Schema
import io.swagger.v3.oas.models.media.StringSchema
import io.swagger.v3.oas.models.responses.ApiResponse
import io.swagger.v3.oas.models.security.SecurityRequirement
import io.swagger.v3.oas.models.security.SecurityScheme
import jakarta.validation.Valid
import org.springdoc.core.customizers.OperationCustomizer
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.web.bind.annotation.PathVariable
import org.springframework.web.bind.annotation.RequestBody

/** Contrato da API em OpenAPI (ADR-0033), com os erros em Problem Details (ADR-0027). */
@Configuration
class OpenApiConfig {

    @Bean
    fun openApi(): OpenAPI = OpenAPI()
        .info(
            Info()
                .title("FinanceFlow API")
                .version("v1")
                .description("Erros seguem Problem Details (RFC 9457) com um `code` estável (ADR-0027)."),
        )
        .components(
            Components()
                .addSecuritySchemes(
                    BEARER,
                    SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT"),
                )
                .addSchemas(PROBLEM, problemSchema()),
        )
        // Rotas públicas anulam isso com @SecurityRequirements vazio
        .addSecurityItem(SecurityRequirement().addList(BEARER))

    @Bean
    fun errorResponses() = OperationCustomizer { operation, handler ->
        val errors = buildList {
            val public = handler.hasMethodAnnotation(SecurityRequirements::class.java) ||
                handler.beanType.isAnnotationPresent(SecurityRequirements::class.java)
            if (!public) add(Error(401, "UNAUTHORIZED", "Sem access token válido"))
            val parameters = handler.methodParameters
            if (parameters.any { it.hasParameterAnnotation(PathVariable::class.java) }) {
                add(Error(404, "NOT_FOUND", "Não existe ou é de outro usuário (ADR-0012)"))
            }
            if (parameters.any { it.hasParameterAnnotation(RequestBody::class.java) && it.hasParameterAnnotation(Valid::class.java) }) {
                add(Error(400, "MALFORMED_REQUEST", "Corpo ausente ou JSON malformado"))
                add(Error(422, "VALIDATION_FAILED", "Campos inválidos, listados em `errors`"))
            }
            handler.method.getAnnotationsByType(DocumentedError::class.java)
                .forEach { add(Error(it.status, it.code, it.description)) }
        }
        errors.groupBy { it.status }.toSortedMap().forEach { (status, sameStatus) ->
            val description = sameStatus.joinToString("; ") { "`${it.code}`: ${it.description}" }
            val content = Content().addMediaType(
                "application/problem+json",
                MediaType().schema(Schema<Any>().`$ref`("#/components/schemas/$PROBLEM")),
            )
            operation.responses.addApiResponse(status.toString(), ApiResponse().description(description).content(content))
        }
        operation
    }

    private data class Error(val status: Int, val code: String, val description: String)

    private fun problemSchema(): Schema<*> {
        val fieldError = ObjectSchema()
            .addProperty("field", StringSchema())
            .addProperty("message", StringSchema())
        return ObjectSchema()
            .description("Problem Details (RFC 9457)")
            .addProperty("type", StringSchema())
            .addProperty("title", StringSchema())
            .addProperty("status", IntegerSchema())
            .addProperty("detail", StringSchema().description("Mensagem para o usuário"))
            .addProperty("instance", StringSchema())
            .addProperty("code", StringSchema().description("Código estável do erro"))
            .addProperty("errors", ArraySchema().items(fieldError).description("Só em `VALIDATION_FAILED`"))
            .required(listOf("status", "code"))
    }

    private companion object {
        const val BEARER = "bearer"
        const val PROBLEM = "Problem"
    }
}
