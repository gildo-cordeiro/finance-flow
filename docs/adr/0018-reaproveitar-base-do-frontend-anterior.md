# ADR-0018 — Reaproveitar a base visual e as ferramentas do frontend anterior

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': sugestão a partir da análise do repositório anterior; não está na especificação.

## Contexto

O frontend anterior usa a mesma stack da especificação (ADR-0017) e já tem um design system: tema escuro, tokens em variáveis CSS HSL, tooling do shadcn/ui e 17 componentes base. As telas, por outro lado, estão presas à API antiga, e o `TransactionFormModal.tsx` chegou a 1.031 linhas.

## Decisão

Copiar do projeto anterior, e só isto:
- tokens de design (cores em HSL, texto, tipografia mínima de 12 px) e o tema escuro;
- `components.json`, `lib/cn.ts` e os componentes de `components/ui`;
- Tailwind CSS 3.4 com `tailwindcss-animate`;
- formulários com React Hook Form e Zod;
- configuração de ESLint, Vitest, Testing Library e Husky.

Telas, hooks, chamadas de API e contextos são reescritos sobre a nova API, usando as telas antigas só como referência visual.

## Consequências

- O visual e as ferramentas ficam prontos no primeiro dia.
- O Tailwind fica no v3; migrar para o v4 vira uma decisão futura separada.

## Alternativas consideradas

- Começar o frontend do zero: refaz trabalho visual que já está bom.
- Copiar o frontend inteiro: carrega contratos de API e componentes que a especificação mudou.

## Evidências

- Projeto anterior: ADR antigo 0010, ADR antigo 0023, ADR antigo 0030, ADR antigo 0037, ADR antigo 0038, ADR antigo 0040; `frontend/src/components/ui`, `frontend/package.json`

## Perguntas em aberto

- O tema escuro único continua, ou o novo projeto deve ter tema claro também?
- Manter o Tailwind v3 ou já começar no v4?
