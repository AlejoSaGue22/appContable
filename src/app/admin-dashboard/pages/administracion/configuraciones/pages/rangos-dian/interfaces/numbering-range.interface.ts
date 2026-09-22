export type NumberingRangeDomain = 'billing' | 'payroll';

export interface NumberingRange {
  id: string;
  factusId: number;
  domain: NumberingRangeDomain;
  document: string | null;
  prefix: string | null;
  resolutionNumber: string | null;
  technicalKey: string | null;
  fromNumber: number | null;
  toNumber: number | null;
  currentNumber: number | null;
  isActive: boolean;
  isExpired: boolean;
  validFrom: string | null;
  validTo: string | null;
  syncedAt: string | null;
  source: string;
  empresaId: string | null;
  lastUsedAt: string | null;
  rawJson?: any;
  createdAt: string;
  updatedAt: string;
}

export interface NumberingRangeListResponse {
  success: boolean;
  data: NumberingRange[];
  message: string;
}

export interface SyncRangesResponse {
  success: boolean;
  data: Record<string, { synced?: number; error?: string }>;
  message: string;
}

export const DOCUMENT_LABELS: Record<string, string> = {
  '01': 'Factura electrónica',
  NC: 'Nota crédito',
  ND: 'Nota débito',
  DS: 'Documento soporte',
  NA: 'Nota ajuste doc. soporte',
  NOM: 'Nómina',
};

export function documentLabel(code: string | null): string {
  if (!code) return '—';
  return DOCUMENT_LABELS[code] ?? code;
}

/** % consumido del rango (0-100) o null si no hay datos de numeración. */
export function consumptionPercent(r: NumberingRange): number | null {
  if (r.fromNumber === null || r.toNumber === null || r.currentNumber === null) return null;
  const total = r.toNumber - r.fromNumber + 1;
  if (total <= 0) return null;
  const used = Math.min(Math.max(r.currentNumber - r.fromNumber, 0), total);
  return Math.round((used / total) * 100);
}

export function remainingNumbers(r: NumberingRange): number | null {
  if (r.toNumber === null || r.currentNumber === null) return null;
  return r.toNumber - r.currentNumber;
}

/** Días restantes de vigencia o null si no hay fecha fin. Negativo = vencido. */
export function validityDaysLeft(r: NumberingRange): number | null {
  if (!r.validTo) return null;
  const ms = new Date(r.validTo).getTime() - Date.now();
  return Math.ceil(ms / 86400000);
}

export type RangeHealth = 'inactive' | 'expired' | 'warning' | 'ok';

export function rangeHealth(r: NumberingRange): RangeHealth {
  if (!r.isActive) return 'inactive';
  const days = validityDaysLeft(r);
  if (r.isExpired || (days !== null && days < 0)) return 'expired';
  const pct = consumptionPercent(r);
  const remaining = remainingNumbers(r);
  if ((pct !== null && pct >= 90) || (remaining !== null && remaining <= 50)) return 'warning';
  if (days !== null && days <= 30) return 'warning';
  return 'ok';
}

export const HEALTH_LABELS: Record<RangeHealth, string> = {
  inactive: 'Inactivo',
  expired: 'Vencido',
  warning: 'Por vencer / agotar',
  ok: 'Vigente',
};
