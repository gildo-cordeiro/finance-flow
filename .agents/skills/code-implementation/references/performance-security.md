# Performance e segurança

> Referência da skill `code-implementation`. Leia só quando a tarefa envolver este assunto. Fluxo e princípios gerais: `../SKILL.md`.

## 7. Performance e Segurança

### Performance

- **Não otimize antes de medir** — use profiler, não intuição
- Identifique o gargalo real: I/O? CPU? Memória? Lock contention?
- Prefira operações em batch para DB (evite N+1 — use `FETCH JOIN` ou `@EntityGraph`)
- Use índices corretos no banco; analise query plan antes de ir para produção
- Cache Redis (quando for implementado; hoje é planejado) com TTL explícito e invalidação proativa — nunca cache sem estratégia de eviction

### Segurança

- **Nunca** hardcode credenciais, tokens ou secrets — use variáveis de ambiente
- Valide e sanitize toda entrada externa antes de usar
- SQL: sempre use JPA / Prepared Statements — nunca concatenação de string
- Logs: nunca logue PII (CPF, e-mail, telefone, senha) sem mascaramento
- Dependências: audite regularmente (`./gradlew dependencyCheckAnalyze`)
