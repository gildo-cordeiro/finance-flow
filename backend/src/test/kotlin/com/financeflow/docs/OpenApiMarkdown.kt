package com.financeflow.docs

import tools.jackson.databind.JsonNode
import java.text.Collator
import java.util.Locale

/** Monta o `docs/api.md` a partir da especificação OpenAPI (ADR-0033, ADR-0038). */
object OpenApiMarkdown {

    private val byName = Collator.getInstance(Locale.of("pt", "BR"))
    private val methods = listOf("get", "post", "put", "patch", "delete")

    fun render(spec: JsonNode): String = buildString {
        appendLine("# API do FinanceFlow")
        appendLine()
        appendLine("<!-- Gerado a partir do OpenAPI pelo ApiDocsTest. Não edite à mão. -->")
        appendLine()
        appendLine("> Gerado a partir do código. Para atualizar, rode no `backend/`:")
        appendLine("> `UPDATE_API_DOCS=true ./gradlew test --tests 'com.financeflow.docs.ApiDocsTest'`")
        appendLine()
        appendLine(spec["info"]["description"].asString())
        appendLine()
        appendLine("Salvo indicação, as rotas exigem `Authorization: Bearer <accessToken>`.")
        appendLine()

        val tagDescriptions = spec["tags"].values().associate { it["name"].asString() to it.text("description") }
        val operations = spec["paths"].properties().flatMap { (path, item) ->
            methods.mapNotNull { method -> item[method]?.let { Operation(path, method, it) } }
        }
        operations.groupBy { it.node["tags"][0].asString() }
            .toSortedMap(byName)
            .forEach { (tag, inTag) ->
                appendLine("## $tag")
                appendLine()
                tagDescriptions[tag]?.let { appendLine(it); appendLine() }
                inTag.forEach { appendOperation(it) }
            }

        appendLine("## Schemas")
        appendLine()
        spec["components"]["schemas"].properties().forEach { (name, schema) -> appendSchema(name, schema) }
    }.trimEnd() + "\n"

    private data class Operation(val path: String, val method: String, val node: JsonNode)

    private fun StringBuilder.appendOperation(operation: Operation) {
        val node = operation.node
        appendLine("### `${operation.method.uppercase()} ${operation.path}`")
        appendLine()
        appendLine(node.text("summary") ?: "")
        appendLine()
        node.text("description")?.let { appendLine(it); appendLine() }
        if (node["security"]?.isEmpty == true) {
            appendLine("Pública, sem access token.")
            appendLine()
        }

        val parameters = node["parameters"]?.values().orEmpty()
        if (parameters.isNotEmpty()) {
            appendLine("| Parâmetro | Em | Tipo | Obrigatório | Descrição |")
            appendLine("| --- | --- | --- | --- | --- |")
            parameters.forEach {
                val default = it["schema"]["default"]?.let { value -> "Padrão: `${value.asString()}`." }
                val description = listOfNotNull(it.text("description")?.let { text -> "$text." }, default).joinToString(" ")
                appendLine(
                    row(
                        "`${it["name"].asString()}`", it["in"].asString(), type(it["schema"]),
                        yesNo(it["required"]?.asBoolean() == true), description,
                    ),
                )
            }
            appendLine()
        }

        node["requestBody"]?.let {
            appendLine("Corpo: ${type(it["content"].values().first()["schema"])}")
            appendLine()
        }

        appendLine("| Status | Descrição | Corpo |")
        appendLine("| --- | --- | --- |")
        node["responses"].properties().forEach { (status, response) ->
            val body = response["content"]?.values()?.firstOrNull()?.get("schema")?.let { type(it) } ?: ""
            appendLine(row(status, response.text("description") ?: "", body))
        }
        appendLine()
    }

    private fun StringBuilder.appendSchema(name: String, schema: JsonNode) {
        appendLine("### $name")
        appendLine()
        schema.text("description")?.let { appendLine(it); appendLine() }
        // Resposta: todo campo vem sempre; o que importa é se pode ser nulo
        val isResponse = name.endsWith("Response") || name == "Problem"
        val required = schema["required"]?.values()?.map { it.asString() }.orEmpty().toSet()
        appendLine("| Campo | Tipo | ${if (isResponse) "Pode ser nulo" else "Obrigatório"} | Descrição |")
        appendLine("| --- | --- | --- | --- |")
        schema["properties"].properties().forEach { (field, property) ->
            val flag = if (isResponse) yesNo(property.isNullable()) else yesNo(field in required)
            // Campo obrigatório anulável no Kotlin só para a validação responder 422 em vez de 400
            appendLine(row("`$field`", type(property, nullable = !isResponse && field !in required), flag, describe(property)))
        }
        appendLine()
    }

    private fun describe(property: JsonNode): String {
        val limits = buildList {
            property["minLength"]?.asInt()?.takeIf { it > 0 }?.let { add("mínimo de $it caracteres") }
            property["maxLength"]?.let { add("máximo de ${it.asInt()} caracteres") }
            property["minimum"]?.let { add("mínimo ${it.asString()}") }
            property["maximum"]?.let { add("máximo ${it.asString()}") }
        }
        return listOfNotNull(property.text("description"), limits.joinToString(", ").ifEmpty { null })
            .joinToString(". ")
    }

    private fun JsonNode.isNullable() = get("type")?.let { it.isArray && it.values().any { t -> t.asString() == "null" } } == true

    private fun type(schema: JsonNode, nullable: Boolean = true): String {
        schema.text("\$ref")?.let { ref ->
            val name = ref.substringAfterLast('/')
            return "[$name](#${name.lowercase()})"
        }
        val types = schema["type"]?.let { if (it.isArray) it.values().map { t -> t.asString() } else listOf(it.asString()) }
            .orEmpty()
        val main = types.firstOrNull { it != "null" } ?: "object"
        val base = when {
            schema["enum"] != null -> schema["enum"].values().filter { !it.isNull }.joinToString(" \\| ") { "`${it.asString()}`" }
            main == "array" -> "${type(schema["items"])}[]"
            schema["format"] != null -> "$main (${schema["format"].asString()})"
            else -> main
        }
        return if (nullable && "null" in types) "$base ou nulo" else base
    }

    private fun JsonNode.text(field: String): String? = get(field)?.takeIf { !it.isNull }?.asString()

    private fun yesNo(value: Boolean) = if (value) "sim" else "não"

    private fun row(vararg cells: String) = cells.joinToString(" | ", "| ", " |") { it.replace("|", "\\|").replace("\\\\|", "\\|") }
}
