import { describe, expect, it, vi } from 'vitest';
import { Settings } from './Settings';
import { Profile } from './Profile';

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useState: (initial: unknown) => [typeof initial === 'function' ? (initial as () => unknown)() : initial, vi.fn()],
    useEffect: vi.fn(),
  };
});

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-id-123',
      name: 'Usuário Teste',
      email: 'teste@email.com',
      timeZone: 'America/Sao_Paulo',
      currency: 'BRL',
      budgetClosingDay: 1,
      dateFormat: 'dd/MM/yyyy',
    },
    updateProfile: vi.fn(),
  }),
}));

vi.mock('./settings/ProfileTab', () => ({ ProfileTab: () => null }));
vi.mock('./settings/CategoriesTab', () => ({ CategoriesTab: () => null }));
vi.mock('./settings/CoupleTab', () => ({ CoupleTab: () => null }));
vi.mock('./settings/OpenFinanceTab', () => ({ OpenFinanceTab: () => null }));
vi.mock('./settings/DangerZoneTab', () => ({ DangerZoneTab: () => null }));
vi.mock('../../couple/components/CoupleSettingsSection', () => ({ CoupleSettingsSection: () => null }));

describe('UX-13 — Settings adjustments', () => {
  it('does not contain fixed height or overflow-y-auto on main content container', () => {
    const element = Settings();
    expect(element).toBeDefined();

    // PageContainer children: PageHeader, Main Settings Page Container, Footer User ID
    const [pageHeader, settingsContainer, footer] = element.props.children;
    expect(pageHeader).toBeDefined();
    expect(settingsContainer).toBeDefined();
    expect(footer).toBeDefined();

    // In settingsContainer, second child is <main>
    const [, mainContent] = settingsContainer.props.children;
    expect(mainContent.type).toBe('main');
    expect(mainContent.props.className).not.toContain('max-h-');
    expect(mainContent.props.className).not.toContain('overflow-y-auto');
    expect(mainContent.props.className).toContain('flex-1');
  });

  it('removes User ID from PageHeader and renders it in footer with 12px text-text-muted and a Copiar button', () => {
    const element = Settings();
    const [pageHeader, , footer] = element.props.children;

    // Header actions should be undefined / not contain user ID
    expect(pageHeader.props.actions).toBeUndefined();

    // Footer container checks
    expect(footer.props.className).toContain('text-xs'); // 12px
    expect(footer.props.className).toContain('text-text-muted');

    const [idSpan, copyButton] = footer.props.children;
    expect(idSpan.props.children).toEqual(['ID do Usuário: ', 'test-user-id-123']);

    // Check copy button
    expect(copyButton).toBeDefined();
    const [, buttonLabel] = copyButton.props.children;
    expect(buttonLabel.props.children).toBe('Copiar');
  });
});

describe('UX-13 — Profile adjustments', () => {
  it('removes "Voltar ao Painel" link from Profile header', () => {
    const element = Profile();
    expect(element).toBeDefined();

    const [header] = element.props.children;
    expect(header.type).toBe('header');

    // Header should now contain only user ID and not contain Voltar ao Painel button
    const headerContent = JSON.stringify(header.props);
    expect(headerContent).not.toContain('Voltar ao Painel');
  });
});
