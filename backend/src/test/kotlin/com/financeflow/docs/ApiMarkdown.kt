package com.financeflow.docs

/** Converte a especificação OpenAPI no `docs/api.md`, em ordem estável para o diff do PR mostrar só o que mudou. */
@Suppress("UNCHECKED_CAST")
class ApiMarkdown(private val spec: Map<String, Any?>) {

    private val out = StringBuilder()

    fun render(): String {
        val info = spec.map("info")
        line("# ${info["title"]} (${info["version"]})")
        line()
        line("> Gerado pelo `ApiDocsTest` a partir do OpenAPI (ADR-0033). Não edite à mão: rode")
        line("> `UPDATE_API_DOCS=true ./gradlew test --tests 'com.financeflow.docs.ApiDocsTest'` em `backend/`.")
        line()
        line(info["description"].toString())
        tags().forEach { renderTag(it) }
        renderSchemas()
        return out.toString().trimEnd() + "\n"
    }

    private fun tags(): List<Map<String, Any?>> =
        (spec["tags"] as List<Map<String, Any?>>).sortedBy { it["name"].toString() }

    private fun operations(): List<Operation> =
        spec.map("paths").flatMap { (path, item) ->
            (item as Map<String, Any?>).map { (method, op) -> Operation(path, method, op as Map<String, Any?>) }
        }.sortedWith(compareBy({ it.path }, { METHODS.indexOf(it.method) }))

    private fun renderTag(tag: Map<String, Any?>) {
        line()
        line("## ${tag["name"]}")
        line()
        line(tag["description"].toString())
        operations().filter { tag["name"] in it.op.list("tags") }.forEach { renderOperation(it) }
    }

    private fun renderOperation(operation: Operation) {
        val op = operation.op
        line()
        line("### `${operation.method.uppercase()} ${operation.path}`")
        line()
        line("${op["summary"]}.")
        (op["description"] as String?)?.let {
            line()
            line(it)
        }
        line()
        line(if (op.list("security").isEmpty()) "Pública." else "Exige `Authorization: Bearer`.")

        val parameters = op.list("parameters").map { it as Map<String, Any?> }
        if (parameters.isNotEmpty()) {
            line()
            line("| Parâmetro | Em | Tipo | Obrigatório |")
            line("|---|---|---|---|")
            parameters.forEach { p ->
                val schema = p.map("schema")
                val default = schema["default"]?.let { " (padrão `$it`)" }.orEmpty()
                line("| `${p["name"]}` | ${p["in"]} | ${type(schema)}$default | ${yesNo(p["required"] == true)} |")
            }
        }

        (op["requestBody"] as Map<String, Any?>?)?.let { body ->
            val schema = body.map("content").values.first().let { (it as Map<String, Any?>).map("schema") }
            val required = if (body["required"] == true) "" else " (opcional)"
            line()
            line("Corpo: ${type(schema)}$required")
        }

        line()
        line("| Status | Resposta |")
        line("|---|---|")
        op.map("responses").entries.sortedBy { it.key }.forEach { (status, value) ->
            val response = value as Map<String, Any?>
            val content = response["content"] as Map<String, Any?>?
            val schema = content?.values?.firstOrNull()?.let { (it as Map<String, Any?>)["schema"] as Map<String, Any?>? }
            val description = response["description"].toString()
            val text = when {
                schema == null && status == "204" -> "Sem conteúdo"
                schema == null -> description
                status.startsWith("2") -> type(schema)
                else -> "${type(schema)}: ${description.substringAfter(": ")}"
            }
            line("| $status | $text |")
        }
    }

    private fun renderSchemas() {
        line()
        line("## Esquemas")
        spec.map("components").map("schemas").entries.sortedBy { it.key }.forEach { (name, value) ->
            val schema = value as Map<String, Any?>
            val required = schema.list("required")
            line()
            line("### $name")
            (schema["description"] as String?)?.let {
                line()
                line(it)
            }
            line()
            // Só os corpos de entrada têm `required`; nas respostas, o tipo já diz o que pode vir nulo
            if (required.isEmpty()) {
                line("| Campo | Tipo | Observação |")
                line("|---|---|---|")
            } else {
                line("| Campo | Tipo | Obrigatório | Observação |")
                line("|---|---|---|---|")
            }
            schema.map("properties").forEach { (field, property) ->
                val p = property as Map<String, Any?>
                if (required.isEmpty()) {
                    line("| `$field` | ${type(p)} | ${notes(p)} |")
                } else {
                    val isRequired = field in required
                    line("| `$field` | ${type(p, nullable = !isRequired)} | ${yesNo(isRequired)} | ${notes(p)} |")
                }
            }
        }
    }

    private fun type(schema: Map<String, Any?>, nullable: Boolean = true): String {
        schema["\$ref"]?.let { ref ->
            val name = ref.toString().substringAfterLast('/')
            return "[$name](#${name.lowercase()})"
        }
        val types = when (val t = schema["type"]) {
            is List<*> -> t.map { it.toString() }
            null -> listOf("object")
            else -> listOf(t.toString())
        }
        val base = types.first { it != "null" }
        val text = when {
            schema["enum"] != null -> schema.list("enum").joinToString(" \\| ") { "`$it`" }
            base == "array" -> type(schema.map("items")).let { if ("|" in it) "($it)[]" else "$it[]" }
            schema["format"] != null -> "$base (${schema["format"]})"
            else -> base
        }
        return if (nullable && "null" in types) "$text \\| null" else text
    }

    private fun notes(schema: Map<String, Any?>): String = listOfNotNull(
        schema["description"] as String?,
        when (val min = schema["minLength"] as Int?) {
            null, 0 -> null
            1 -> "não pode ficar em branco"
            else -> "mín. $min caracteres"
        },
        schema["maxLength"]?.let { "máx. $it caracteres" },
        schema["minimum"]?.let { "mínimo $it" },
        schema["maximum"]?.let { "máximo $it" },
        schema["example"]?.let { "ex.: `$it`" },
    ).joinToString("; ")

    private fun yesNo(value: Boolean) = if (value) "sim" else "não"

    private fun line(text: String = "") {
        out.append(text).append('\n')
    }

    private fun Map<String, Any?>.map(key: String) = (this[key] as Map<String, Any?>?).orEmpty()

    private fun Map<String, Any?>.list(key: String) = (this[key] as List<Any?>?).orEmpty()

    private data class Operation(val path: String, val method: String, val op: Map<String, Any?>)

    private companion object {
        val METHODS = listOf("get", "post", "put", "patch", "delete")
    }
}
