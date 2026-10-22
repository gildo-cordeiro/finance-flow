# ADR-0014 — Open Finance por agregador autorizado, com importação OFX e CSV antes

- Status: Aceito
- Data: 2026-10-22
- Origem do 'porquê': especificação (D-02, RF-028, RF-060).

## Contexto

As APIs do Open Finance Brasil só podem ser consumidas por instituições autorizadas pelo Banco Central. Um projeto pessoal não consegue se conectar diretamente.

## Decisão

- A integração da Fase 3 usa um agregador autorizado (Pluggy ou Belvo), escolhido por preço e condições antes do início da fase.
- O módulo `openfinance` expõe uma interface própria (`OpenFinanceProvider`), e o agregador é um adaptador dela.
- Na Fase 2 entra a importação de extratos OFX e CSV, que cobre boa parte da necessidade sem depender de terceiros.
- Se o agregador for caro, a Fase 3 vai para o fim do roadmap.
- Transações importadas guardam `external_id` para deduplicação; credenciais e tokens do agregador ficam criptografados (AES-256).

## Consequências

- O produto entrega importação útil antes de ter custo com agregador.
- Trocar de agregador afeta só o adaptador.

## Alternativas consideradas

- Integração direta com as APIs do Open Finance: exige ser instituição autorizada.
- Só importação de arquivos: funciona, mas sem sincronização automática.

## Evidências

- Especificação: D-02, RF-028, RF-060 a RF-066, RNF-02
- Projeto anterior: ADR antigo 0016 (Open Finance adiado)

## Perguntas em aberto

- Qual agregador? Comparar preço, plano para uso pessoal e instituições suportadas antes da Fase 3.
