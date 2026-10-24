import { describe, expect, it } from 'vitest';
import { BRAZIL_TIMEZONES, timezoneGroups } from './timezones';

describe('timezoneGroups', () => {
  it('lista o Brasil primeiro e os demais fusos em ordem, sem repetir os do Brasil', () => {
    const { brazil, others } = timezoneGroups(undefined, ['Europe/Lisbon', 'America/Sao_Paulo', 'America/New_York']);

    expect(brazil).toBe(BRAZIL_TIMEZONES);
    expect(others).toEqual([
      { id: 'America/New_York', label: 'America/New York' },
      { id: 'Europe/Lisbon', label: 'Europe/Lisbon' },
    ]);
  });

  it('inclui o fuso atual quando o navegador não o conhece', () => {
    const { others } = timezoneGroups('Asia/Tokyo', []);

    expect(others).toEqual([{ id: 'Asia/Tokyo', label: 'Asia/Tokyo' }]);
  });

  it('não duplica o fuso atual quando ele é do Brasil', () => {
    const { others } = timezoneGroups('America/Manaus', []);

    expect(others).toEqual([]);
  });

  it('usa a lista de fusos do navegador por padrão', () => {
    expect(timezoneGroups().others.map(({ id }) => id)).toContain('Europe/Lisbon');
  });
});
