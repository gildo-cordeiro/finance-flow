# ADR-0004 — Chaves UUID e valores monetários em NUMERIC(19,4)

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': especificação para valores decimais (RNF-11); UUID e a precisão vêm do projeto anterior.

## Contexto

A especificação exige valores monetários exatos, nunca em ponto flutuante (RNF-11), mas não define tipo de chave nem precisão.

## Decisão

- Chaves primárias são `UUID`, geradas pela aplicação.
- Valores monetários são `NUMERIC(19,4)` no banco e `BigDecimal` no Kotlin, arredondados para 2 casas (`HALF_EVEN`) só na exibição e na geração de parcelas.

## Consequências

- IDs não expõem volume de dados e podem ser criados antes de gravar (útil para parcelas e transferências em grupo).
- `BigDecimal` exige cuidado com `equals` (usar `compareTo`) e com a escala nas comparações.

## Alternativas consideradas

- Inteiro em centavos (`BIGINT`): simples e exato, mas exige conversão em toda a API e no frontend.
- Chaves sequenciais (`BIGSERIAL`): menores e ordenáveis, mas previsíveis nas URLs.

## Evidências

- Especificação: RNF-11
- Projeto anterior: ADR antigo 0005

## Perguntas em aberto

- Confirmar `NUMERIC(19,4)` ou preferir centavos em `BIGINT`.
