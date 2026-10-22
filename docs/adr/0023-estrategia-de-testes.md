# ADR-0023 — Estratégia de testes e verificação automática

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': especificação (RNF-05, RNF-09). As ferramentas são sugestão, a partir do projeto anterior.

## Contexto

As regras de competência, fatura e parcelamento são o diferencial do produto e as mais fáceis de errar. O isolamento de dados protege informação financeira. No projeto anterior o frontend tinha um único teste.

## Decisão

- Backend com no mínimo 70% de cobertura, medida no CI.
- RN-01 a RN-06 (datas, competência, fatura, parcelas, status) com testes unitários do domínio, sem Spring.
- Testes de integração com PostgreSQL real (Testcontainers), incluindo um teste de isolamento por endpoint (ADR-0012).
- Frontend: lint, testes de componentes e de utilitários de data, e build no CI.
- Ferramentas: JUnit 5 com MockK e AssertJ (ou Kotest) no backend; Vitest e Testing Library no frontend; Kover ou JaCoCo para cobertura.

## Consequências

- Regras centrais podem ser alteradas com segurança.
- Testcontainers exige Docker no CI e na máquina de desenvolvimento.

## Alternativas consideradas

- Banco em memória (H2) nos testes: diverge do PostgreSQL em tipos e SQL.

## Evidências

- Especificação: RNF-05, RNF-09
- Projeto anterior: ADR antigo 0020

## Perguntas em aberto

- JUnit 5 com MockK ou Kotest?
