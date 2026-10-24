# ADR-0038 — Regras de detalhe de parcelas, recorrências e competência sugerida (complementa 0008 e 0010)

- Status: Proposto
- Data: 2026-10-24
- Origem do 'porquê': especificação (RN-03, RN-04, RN-05, RN-06, RN-12, RF-022, RF-023, RF-024, D-01, D-08) e sugestão (lacunas encontradas ao confrontar a `V1` com os cards F1-10, F1-11, F1-13, F1-14 e F2-01).

## Contexto

O ADR-0008 define a fórmula da competência sugerida e o ADR-0010 define que parcelas e recorrências são transações materializadas. Ao detalhar a implementação contra a `V1`, sobram perguntas que nenhum dos dois responde e que mudam o schema:

1. **A data da compra não é guardada.** `transactions` tem só competência, vencimento e pagamento. Para compras no cartão, a RN-04 usa a data da compra para escolher a fatura. Sem ela, não dá para reatribuir a compra (correção de data, mudança de fechamento, conferência com o Open Finance na F3-03), e as parcelas 2..N não têm de onde partir.
2. **Não se sabe se a competência foi sugerida ou informada.** "A sugestão nunca sobrescreve um valor informado" (ADR-0008), mas, ao editar o vencimento, o backend não tem como saber se deve recalcular a competência.
3. **Competência informada em série.** Se o usuário muda a competência da parcela 1 de 10, aplicar o mesmo mês às outras nove junta todas no mesmo orçamento.
4. **Idempotência da recorrência.** O card F2-01 sugere único em `recurrence_id + due_date`. Isso quebra quando o usuário edita o vencimento de uma ocorrência, e o job recria uma ocorrência que o usuário excluiu com "só esta".
5. **Recorrência no cartão** (assinaturas): o deslocamento da recorrência (D-08) conflita com a regra de que compras herdam a competência da fatura (ADR-0009).
6. **`due_date` é anulável** na `V1`, e a RN-03 não diz qual é a referência quando não há vencimento.
7. **Alcance (RN-12) em recorrências**: o que acontece com as ocorrências já pagas e com o modelo.

## Decisão

### Competência sugerida

Um único componente de domínio, `Competence.suggest(referenceDate, offset): YearMonth`, em `shared` (é usado por `transaction` e por `invoice`, e mora fora dos dois para não criar dependência circular entre os módulos).

| Caso | Data de referência | Deslocamento |
| --- | --- | --- |
| Despesa ou receita em conta comum | `due_date`; sem vencimento, `payment_date`; sem nenhuma das duas, 422 | da conta |
| Compra no cartão (à vista, parcela ou ocorrência) | vencimento da fatura | do cartão, já aplicado em `invoices.competence_month`; a transação copia esse mês |
| Parcela em conta comum | vencimento da própria parcela | da conta |
| Ocorrência de recorrência em conta comum | vencimento da própria ocorrência | da recorrência; se nulo, da conta |
| Transferência | `payment_date` | 0 (transferências não entram no orçamento) |

- Nova coluna `transactions.competence_informed BOOLEAN NOT NULL DEFAULT FALSE`. Quando o cliente envia a competência, ela vale e a coluna fica `TRUE`. Ao editar a data de referência de uma transação com `FALSE`, o backend recalcula a competência; com `TRUE`, mantém.
- Mudar o deslocamento de uma conta ou de um cartão vale só para sugestões novas (inclusive ocorrências e faturas criadas depois). Transações e faturas existentes não mudam: recalcular moveria o realizado de orçamentos passados sem o usuário ver.

### Parcelas

- Nova coluna `transactions.purchase_date DATE`, preenchida se, e somente se, a transação está numa fatura (`(invoice_id IS NULL) = (purchase_date IS NULL)`). Todas as parcelas de uma compra guardam a mesma data da compra, como a fatura do banco mostra.
- Índice único parcial em `(installment_group_id, installment_number)`.
- Vencimento das parcelas em conta comum: `primeiroVencimento.plusMonths(n − 1)`, sempre a partir do primeiro vencimento, nunca da parcela anterior. Assim 31/01 vira 28/02 e depois 31/03, e não 28/03.
- No cartão, a parcela n cai na fatura `InvoiceCycle.next()` aplicado n − 1 vezes à fatura da compra, e não na fatura da data da compra + n − 1 meses.
- Status inicial: a parcela 1 segue a regra do lançamento manual (F1-11); as demais nascem `PENDING`. Parcela é dívida assumida, não previsão.
- `description` guarda o texto sem o sufixo. O "(3/10)" é montado na resposta da API a partir de `installment_number` e `total_installments`, para que editar a descrição ou encurtar a série não exija reescrever texto.
- Competência informada em série vira deslocamento relativo: se a parcela k passa de julho para junho, cada parcela afetada pelo alcance recua um mês e passa a ter `competence_informed = TRUE`.

### Recorrências

Tabela `recurrences` (Fase 2):

| Coluna | Regra |
| --- | --- |
| `id`, `user_id` (`ON DELETE CASCADE`), `account_id`, `category_id`, `type`, `description`, `amount`, `visibility` | como em `transactions` |
| `rule_type` | `DAY_OF_MONTH` ou `NTH_BUSINESS_DAY` |
| `rule_day` | 1 a 31 para `DAY_OF_MONTH`; 1 a 23 para `NTH_BUSINESS_DAY` |
| `competence_offset` | anulável: nulo herda o da conta no momento da geração; sempre nulo em cartão |
| `horizon_months` | 1 a 60, padrão 12 |
| `start_month`, `end_month` | dia 1; `end_month` nulo = sem fim |
| `generated_until` | último mês já gerado (dia 1) |

- Em `transactions`: FK `recurrence_id` (`ON DELETE SET NULL`) e nova coluna `recurrence_period DATE` (o mês da ocorrência, dia 1), preenchida se, e somente se, `recurrence_id` também estiver, com índice único parcial em `(recurrence_id, recurrence_period)`.
- Geração: ao criar a recorrência, na mesma transação de banco, e depois por um job diário. O job gera só os meses depois de `generated_until` e até o mês de hoje do usuário (`UserClock`) + `horizon_months`, respeitando `end_month`, e avança `generated_until`. O índice único é a rede de segurança contra execuções concorrentes. Uma ocorrência excluída com "só esta" não volta, porque o mês dela já está abaixo de `generated_until`.
- Data da ocorrência: `DAY_OF_MONTH` usa o último dia do mês quando o dia não existe. `NTH_BUSINESS_DAY` conta segunda a sexta, sem feriados nesta versão; se o mês tiver menos dias úteis, usa o último.
- Em conta comum, a data gerada é o vencimento. Em cartão, é a data da compra: a ocorrência vai para a fatura pela RN-04 e herda a competência dela, e por isso a recorrência de cartão não tem deslocamento próprio.
- Status inicial `PLANNED`. A passagem automática para `OVERDUE` (RF-025) vale para `PLANNED` e `PENDING`.

### Alcance (RN-12)

Transações `PAID` nunca mudam por uma edição em série: pagamento é histórico (RN-01).

| Alcance | Parcelas | Recorrências |
| --- | --- | --- |
| `THIS` | só a linha | só a linha; ela continua ligada à recorrência |
| `THIS_AND_FUTURE` | linhas k..N não pagas; excluir encurta a série e atualiza `total_installments` para k − 1 | atualiza o modelo e as ocorrências não pagas do mês k em diante; excluir define `end_month` como o mês anterior a k |
| `ALL` | o grupo inteiro; parcelas pagas exigem `force=true` (`PAID_INSTALLMENTS_AFFECTED`, F1-13) | atualiza o modelo e todas as ocorrências não pagas; excluir apaga as não pagas e encerra a recorrência, mantendo as pagas |

Toda edição em série é uma única transação de banco (ADR-0010). Mudar o valor de uma parcela com `ALL` ou `THIS_AND_FUTURE` refaz a divisão das parcelas não pagas afetadas, com os centavos na última (RF-023).

## Consequências

- O backend sabe sozinho quando recalcular a competência, e a regra "sugestão nunca sobrescreve" fica testável no domínio.
- Faturas podem ser reatribuídas a partir da data real da compra, o que a F3-03 e a pergunta em aberto do ADR-0009 (mudança de fechamento) precisam.
- O job de recorrência fica idempotente por construção e respeita exclusões pontuais.
- Duas migrations: uma na Fase 1 (`purchase_date`, `competence_informed`, índice único de parcelas e os CHECKs) e outra na Fase 2 (`recurrences`, `recurrence_period` e a FK).
- O card F1-13 muda num ponto: a descrição não leva mais o sufixo "(n/N)". O card F2-01 muda na chave de idempotência.
- Ocorrências pagas de uma recorrência excluída ficam com `recurrence_id` apontando para uma recorrência encerrada; a listagem mostra o ícone, mas a recorrência não aparece mais como ativa.

## Alternativas consideradas

- Recalcular a competência ao editar só quando ela é igual à sugestão antiga, sem coluna: implícito, e erra quando o usuário informa justamente o valor que seria sugerido.
- Deixar o frontend decidir quando pedir nova sugestão: tira a regra do backend (ADR-0017, skill `frontend-react`).
- Único em `(recurrence_id, due_date)` (card F2-01): quebra com vencimento editado e recria ocorrências excluídas.
- Recalcular transações existentes quando o deslocamento da conta muda: move o realizado de meses fechados.
- Dividir a recorrência em duas ao editar com `THIS_AND_FUTURE`: desnecessário, porque o passado já está materializado; basta mudar o modelo.
- Usar o deslocamento da recorrência também no cartão: duas regras de competência para o mesmo item de fatura.
- Excluir também as ocorrências pagas com `ALL` em recorrências: apagaria anos de histórico e mudaria saldos passados.

## Evidências

- Especificação: RN-03, RN-04, RN-05, RN-06, RN-12, RF-022, RF-023, RF-024, RF-025, D-01, D-08, entidades Transaction e Recurrence
- ADR-0007, ADR-0008, ADR-0009, ADR-0010, ADR-0011
- `backend/src/main/resources/db/migration/V1__schema_inicial.sql` (sem data da compra; `due_date` anulável; `recurrence_id` sem FK)
- Cards F1-10, F1-11, F1-13, F1-14 e F2-01

## Perguntas em aberto

- Ocorrência `PLANNED` vencida deve virar `OVERDUE` (proposta acima) ou ficar `PLANNED` até o usuário confirmar? Um salário previsto e não confirmado aparecer como "atrasado" pode incomodar.
- Feriados nacionais no N-ésimo dia útil: tabela fixa no código ou ficam de fora até alguém pedir?
- O teto de 60 meses para o horizonte é suficiente?
