package com.financeflow.shared.config

import com.financeflow.shared.error.ProblemResponse
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
import org.springdoc.core.customizers.OpenApiCustomizer
import org.springdoc.core.customizers.OperationCustomizer
import org.springdoc.core.utils.SpringDocUtils
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.HttpStatus
import java.time.YearMonth

/** Contrato da API gerado do código (ADR-0033). O `docs/api.md` é gerado a partir dele pelo `ApiDocsTest`. */
@Configuration
class OpenApiConfig {

    init {
        SpringDocUtils.getConfig().replaceWithSchema(
            YearMonth::class.java,
            StringSchema().format("yyyy-MM").example("2026-10"),
        )
    }

    @Bean
    fun openApi(): OpenAPI = OpenAPI()
        .info(
            Info()
                .title("FinanceFlow API")
                .version("v1")
                .description(
                    "Rotas autenticadas exigem `Authorization: Bearer <access token>`. " +
                        "Erros seguem Problem Details com um `code` estável (ADR-0027).",
                ),
        )
        .components(
            Components()
                .addSecuritySchemes(BEARER, SecurityScheme().type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT"))
                .addSchemas(PROBLEM, problemSchema()),
        )

    @Bean
    fun problemResponses() = OperationCustomizer { operation, handlerMethod ->
        handlerMethod.method.getAnnotationsByType(ProblemResponse::class.java).forEach { problem ->
            operation.responses.addApiResponse(problem.status.toString(), problemResponse(problem.status, problem.codes.toList()))
        }
        operation
    }

    /** Segurança por rota, com a mesma lista de rotas públicas do `SecurityConfig`. */
    @Bean
    fun securityPerRoute() = OpenApiCustomizer { openApi ->
        openApi.paths.orEmpty().forEach { (path, item) ->
            item.readOperationsMap().forEach { (method, operation) ->
                if (SecurityConfig.isPublic(method.name, path)) {
                    operation.security = emptyList()
                } else {
                    operation.security = listOf(SecurityRequirement().addList(BEARER))
                    operation.responses.addApiResponse("401", problemResponse(401, listOf("UNAUTHORIZED")))
                }
            }
        }
    }

    private fun problemResponse(status: Int, codes: List<String>) = ApiResponse()
        .description("${HttpStatus.valueOf(status).reasonPhrase}: " + codes.joinToString(", ") { "`$it`" })
        .content(Content().addMediaType("application/problem+json", MediaType().schema(Schema<Any>().`$ref`(PROBLEM))))

    private fun problemSchema(): Schema<*> = ObjectSchema()
        .description("Problem Details (RFC 9457) com o `code` estável do erro")
        .addProperty("type", StringSchema())
        .addProperty("title", StringSchema())
        .addProperty("status", IntegerSchema())
        .addProperty("detail", StringSchema().description("Mensagem para o usuário"))
        .addProperty("instance", StringSchema())
        .addProperty("code", StringSchema().description("Identificador estável do erro"))
        .addProperty(
            "errors",
            ArraySchema()
                .description("Campos recusados, nos erros de validação")
                .items(ObjectSchema().addProperty("field", StringSchema()).addProperty("message", StringSchema())),
        )

    private companion object {
        const val BEARER = "bearer"
        const val PROBLEM = "ProblemDetail"
    }
}
