export interface TimezoneOption {
  id: string;
  label: string;
}

export interface TimezoneGroups {
  brazil: TimezoneOption[];
  others: TimezoneOption[];
}

// Fusos IANA do Brasil, de leste a oeste; Brasília abre o grupo de UTC−3 por ser o mais comum
export const BRAZIL_TIMEZONES: TimezoneOption[] = [
  { id: 'America/Noronha', label: 'Fernando de Noronha' },
  { id: 'America/Sao_Paulo', label: 'Brasília (SP, RJ, MG, ES, GO, DF e Sul)' },
  { id: 'America/Bahia', label: 'Salvador (BA)' },
  { id: 'America/Fortaleza', label: 'Fortaleza (CE, MA, PI, RN, PB)' },
  { id: 'America/Recife', label: 'Recife (PE)' },
  { id: 'America/Maceio', label: 'Maceió (AL, SE)' },
  { id: 'America/Belem', label: 'Belém (PA, AP)' },
  { id: 'America/Santarem', label: 'Santarém (oeste do PA)' },
  { id: 'America/Araguaina', label: 'Araguaína (TO)' },
  { id: 'America/Campo_Grande', label: 'Campo Grande (MS)' },
  { id: 'America/Cuiaba', label: 'Cuiabá (MT)' },
  { id: 'America/Manaus', label: 'Manaus (AM)' },
  { id: 'America/Porto_Velho', label: 'Porto Velho (RO)' },
  { id: 'America/Boa_Vista', label: 'Boa Vista (RR)' },
  { id: 'America/Eirunepe', label: 'Eirunepé (oeste do AM)' },
  { id: 'America/Rio_Branco', label: 'Rio Branco (AC)' },
];

function availableTimezones(): string[] {
  // Navegadores anteriores a 2022 não têm `supportedValuesOf` e ficam só com os fusos do Brasil
  return typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
}

/**
 * Opções do seletor: Brasil primeiro, depois os demais em ordem alfabética. O fuso atual sempre
 * aparece, mesmo que o navegador não o conheça; quem valida o ID é o backend.
 */
export function timezoneGroups(current?: string, available: string[] = availableTimezones()): TimezoneGroups {
  const brazilIds = new Set(BRAZIL_TIMEZONES.map(({ id }) => id));
  const otherIds = new Set(available.filter((id) => !brazilIds.has(id)));
  if (current && !brazilIds.has(current)) otherIds.add(current);
  const others = [...otherIds].sort().map((id) => ({ id, label: id.replace(/_/g, ' ') }));
  return { brazil: BRAZIL_TIMEZONES, others };
}
