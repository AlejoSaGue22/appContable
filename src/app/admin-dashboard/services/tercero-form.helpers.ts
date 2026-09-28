import { FormGroup, Validators } from '@angular/forms';
import type { Municipality } from '../interfaces/catalogs-interface';
import type { GetCuentasContables } from '../pages/contabilidad/interfaces/cuentas-contables.interface';

export type MunicipioRef = number | string | null | undefined;
export type NumericIdInput = number | string | null | undefined;

/** Normaliza "08421" y 8421 a la misma llave de comparación. */
function normalizeRef(ref: MunicipioRef): string {
  if (ref === null || ref === undefined) return '';
  const text = String(ref).trim();
  if (text === '') return '';
  const asNumber = Number(text);
  return Number.isNaN(asNumber) ? text : String(asNumber);
}

/**
 * SRP: única forma de resolver un municipio por id numérico o por
 * code DIAN ("08421"). Una sola pasada O(n), sin `any`.
 */
export function findMunicipality(
  list: readonly Municipality[],
  ref: MunicipioRef,
): Municipality | undefined {
  const key = normalizeRef(ref);
  if (key === '') return undefined;
  return list.find((m) => String(m.id) === key || m.code === ref || String(m.id) === String(ref));
}

/** SRP: formato de etiqueta "Nombre - Departamento". */
export function formatMunicipality(city: Municipality | undefined): string {
  if (!city) return '';
  return `${city.name} - ${city.department}`;
}

/**
 * Convierte el valor del formulario a id numérico de municipio.
 * Acepta id (8421) o code ("08421") porque id = Number(code).
 */
export function toMunicipalityId(value: NumericIdInput): number {
  return Number(normalizeRef(value));
}

/** Variante opcional: ''/null/undefined -> undefined (respeta @IsOptional). */
export function toOptionalMunicipalityId(value: NumericIdInput): number | undefined {
  const key = normalizeRef(value);
  if (key === '') return undefined;
  return Number(key);
}

/** Coerción de tipoDocumento del select (puede llegar como "6" o 6). */
export function toTipoDocumentoId(value: NumericIdInput): number {
  return Number(normalizeRef(value));
}

/**
 * SRP: cálculo del DV del NIT en un solo lugar.
 * Elimina la duplicación de calculateDV en clientes/proveedores.
 */
export function calculateNitDv(nit: string): string {
  const cleanNit = nit.replace(/\D/g, '');
  if (cleanNit === '') return '';
  const weights = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  const len = cleanNit.length;
  let acc = 0;
  for (let i = 0; i < len; i++) {
    acc += Number(cleanNit[i]) * weights[len - 1 - i];
  }
  const mod = acc % 11;
  return mod > 1 ? String(11 - mod) : String(mod);
}

/**
 * SRP: filtra cuentas de movimiento por prefijo ("13" clientes, "22" proveedores).
 * Evita duplicar el predicado `aceptaMovimiento && codigo.startsWith`.
 */
export function filterCuentasByPrefix(
  cuentas: readonly GetCuentasContables[],
  prefix: string,
): GetCuentasContables[] {
  return cuentas.filter((c) => c.aceptaMovimiento && c.codigo.startsWith(prefix));
}

/**
 * SRP: validaciones por tipo de persona (PN/PJ) compartidas por
 * clientes y proveedores. El componente solo delega.
 */
export function applyPersonaValidations(form: FormGroup, tipo: string): void {
  const nombre = form.get('nombre');
  const apellido = form.get('apellido');
  const razonSocial = form.get('razonSocial');
  if (tipo === 'PN') {
    nombre?.setValidators([Validators.required]);
    apellido?.setValidators([Validators.required]);
    razonSocial?.clearValidators();
  } else if (tipo === 'PJ') {
    razonSocial?.setValidators([Validators.required]);
    nombre?.clearValidators();
    apellido?.clearValidators();
  } else {
    return;
  }
  nombre?.updateValueAndValidity();
  apellido?.updateValueAndValidity();
  razonSocial?.updateValueAndValidity();
}

/** ISP: mensaje seguro desde `unknown` sin usar `any` en el catch. */
export function getUnknownErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Error inesperado';
}
