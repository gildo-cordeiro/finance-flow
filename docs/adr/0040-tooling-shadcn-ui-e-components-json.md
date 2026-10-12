# ADR-0040 — Tooling do shadcn/ui, dependências base e manifesto components.json

- Status: Aceito
- Data: 2026-10-11
- Confiança: alta
- Origem do 'porquê': Issue #112 ([UI-001]), preparando a base para adoção e padronização progressiva de componentes acessíveis e variantes tipadas no frontend.

## Contexto

O FinanceFlow utilizava componentes de UI construídos artesanalmente em `frontend/src/components/ui/` (`Button.tsx`, `Card.tsx`, `Input.tsx`, etc.), sem um padrão reproduzível para componentes com variantes tipadas e primitivos de acessibilidade (Radix UI). Não existia o manifesto `components.json`, e bibliotecas fundamentais como `class-variance-authority` (cva), `tailwindcss-animate` e `@radix-ui/react-slot` não estavam presentes no projeto.

Além disso, a convenção do projeto (ADR-0010 e `.agents/skills/frontend-financeflow/SKILL.md`) determina que o Tailwind CSS deve permanecer estritamente na versão v3.4.x (`^3.4.17`), sem atualizar para a v4.

## Decisão

- Adotar o ecossistema e manifesto `components.json` do shadcn/ui na raiz de `frontend/`, configurado para Vite + React + TypeScript + Tailwind v3.
- Instalar as dependências base do ecossistema: `class-variance-authority` (variantes tipadas), `@radix-ui/react-slot` (composição polimórfica via `asChild`) e `tailwindcss-animate` (animações e transições).
- Manter o Tailwind CSS travado em `^3.4.17` e registrar o plugin `tailwindcss-animate` em `frontend/tailwind.config.js`.
- Manter o utilitário `cn` em `frontend/src/lib/cn.ts` (combinando `clsx` e `tailwind-merge`) e mapear o alias `"utils": "@/lib/cn"` em `components.json`.
- Permitir a coexistência progressiva dos componentes artesanais existentes com novos componentes adicionados no padrão shadcn/ui.

## Consequências

- Novos componentes e refatorações de UI podem ser integrados de forma reproduzível com acessibilidade baseada em primitivos Radix e suporte a variantes tipadas (`cva`).
- O tema visual "Dark Premium" (ADR-0030) permanece preservado através das variáveis HSL e tokens já definidos em `tailwind.config.js` e `src/index.css`.
- Os componentes existentes não sofrem quebra funcional ou visual.

## Alternativas consideradas

- Manter exclusivamente componentes manuais sem manifesto ou CVA: rejeitado devido ao retrabalho na criação de variantes e complexidade na manutenção manual de acessibilidade (ARIA/foco).
- Atualizar para Tailwind v4: rejeitado para respeitar o ADR-0010 e garantir estabilidade das classes e plugins existentes.

## Evidências

- Issue #112
- `frontend/components.json`
- `frontend/tailwind.config.js`
- `frontend/package.json`
- `frontend/src/lib/cn.test.ts`
- ADR-0009 (Stack do frontend)
- ADR-0010 (Tailwind CSS v3)
- ADR-0030 (Design system Dark Premium)

## Perguntas em aberto

- Nenhuma no momento; componentes individuais complexos (Dialog, Select, DropdownMenu) serão introduzidos e migrados através de issues dedicadas subsequentes.
