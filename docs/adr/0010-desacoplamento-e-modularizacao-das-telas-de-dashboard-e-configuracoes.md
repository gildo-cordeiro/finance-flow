# ADR-0010 — Desacoplamento e modularização das telas de Dashboard e Configurações

- Status: Aceito (retroativo)
- Data: 2026-07-12
- Confiança: alta

## Contexto

A medida que o frontend do FinanceFlow acumulou escopos, componentes massivos e altamente acoplados se formaram nas telas cruciais, prejudicando tanto a legibilidade do código quanto dificultando testes locais sem arrastar cadeias extensas de dependência.

## Decisão

Foi feita uma refatoração abrangente no frontend para dividir os componentes das páginas complexas em subcomponentes isolados e focados (separando responsabilidades nos módulos de Metas, Fluxo de Caixa, Orçamentos, e Configurações de Casal). A compilação do TypeScript também passou por uma revisão e saneamento.

## Consequências

- Benefícios: Código frontend muito mais manutenível, sustentável e sem erros no linter/TypeScript. Facilita o mapeamento estrutural dos arquivos, e as alterações locais de tela renderizam isoladamente de forma mais eficiente.
- Desafios: Potencial aumento na complexidade de passagem de props ou estados entre parent e child components.

## Alternativas consideradas

- Não documentadas.

## Evidências

- Commits: `033206f`
- Arquivos: Relativo aos módulos em `frontend/src/features/` (Dashboard, Settings, CashFlow).
- Issues e PRs: PR #61

## Perguntas em aberto

- Nenhuma.
