# Testes (Vitest + Testing Library)

> Referência da skill `frontend-financeflow`. Leia só quando a tarefa envolver este assunto. Regras gerais e convenções confirmadas: `../SKILL.md`.

## 10. Testes (Vitest + Testing Library)

Imports com `@/` funcionam nos testes. `src/test/setup.ts` registra `jest-dom` e o `cleanup`. Rode com `npm test`.

```tsx
// Wrapper reutilizável com todos os providers
function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

// Teste de componente visual
describe('StatusBadge', () => {
  it.each([
    ['PAID',    'Pago'],
    ['PENDING', 'Pendente'],
    ['OVERDUE', 'Atrasado'],
    ['PLANNED', 'Planejado'],
  ] as const)('should render correct label for %s', (status, label) => {
    render(<StatusBadge status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

// Teste de formulário
it('should show validation error when amount is negative', async () => {
  renderWithProviders(<CreateTransactionForm onSuccess={vi.fn()} />);

  await userEvent.type(screen.getByLabelText(/valor/i), '-10');
  await userEvent.click(screen.getByRole('button', { name: /salvar/i }));

  expect(await screen.findByText('Valor deve ser positivo')).toBeInTheDocument();
});

// Seletores — ordem de preferência
// 1. getByRole()       → semântico e acessível (preferido)
// 2. getByLabelText()  → formulários
// 3. getByText()       → conteúdo visível
// 4. getByTestId()     → último recurso (data-testid no componente)
```
