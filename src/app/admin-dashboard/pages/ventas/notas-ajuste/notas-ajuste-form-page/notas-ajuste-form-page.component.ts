import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';

import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { FormErrorLabelComponent } from "src/app/utils/components/form-error-label/form-error-label.component";
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';
import { ListGroupDropdownComponent } from "@shared/components/list-group-dropdown/list-group-dropdown.component";
import { ComprobantesVentasService } from '../../services/comprobantes-ventas.service';
import { NotasAjusteService } from '../../services/notas-ajuste.service';
import { InventarioService } from '@dashboard/services/inventario.service';
import { firstValueFrom } from 'rxjs';
import { CatalogsStore } from '@dashboard/services/catalogs.store';
import { ConceptosNotaCredito, ConceptosNotaDebito, CreateNotaCreditoV2, DisponibilidadFactura, NotaAjusteItem } from "../../../../interfaces/notas-ajuste-interface";
import { GetFacturaRequest } from '@dashboard/interfaces/documento-venta-interface';
import { PreviewAsientoComponent } from '@dashboard/components/preview-asiento/preview-asiento.component';

/**
 * Formulario NC por concepto DIAN (guía 2026, estilo Alegra):
 * el concepto controla columnas, campos editables y cálculo.
 * Sin Forma de Pago en UI: el backend espeja la factura (espejo-factura).
 */
@Component({
 selector: 'app-notas-ajuste-form-page',
 standalone: true,
 imports: [
 HeaderTitlePageComponent,
 ReactiveFormsModule,
 FormErrorLabelComponent,
 RouterLink,
 CurrencyPipe,
 ListGroupDropdownComponent,
 PreviewAsientoComponent
 ],
 templateUrl: './notas-ajuste-form-page.component.html',
})
export class NotasAjusteFormPageComponent implements OnInit {

 headTitle = computed(() => {
 const id = this.notaId() != 'new';
 return {
 title: id ? 'Editar Nota de Crédito' : 'Nueva Nota de Crédito',
 slog: id ? 'Edita una nota crédito vinculada a una factura' : 'Registra una nota crédito vinculada a una factura'
 };
 });

 private fb = inject(FormBuilder);
 private route = inject(ActivatedRoute);
 private router = inject(Router);
  private notasService = inject(NotasAjusteService);
  private ventasService = inject(ComprobantesVentasService);
  private inventarioService = inject(InventarioService);
 private notificationService = inject(NotificationService);
 private loaderService = inject(LoaderService);
 public catalogsStore = inject(CatalogsStore);

 notaId = toSignal(this.route.params.pipe(map(p => p['id'])));
 facturaIdFromQuery = toSignal(this.route.queryParams.pipe(map(p => p['facturaId'])));

 tipoNota = signal<'credito' | 'debito'>('credito');
 /** Catálogo DIAN fijo 1-6 (no depende del store para la UX por concepto). */
 conceptosFijos = computed(() => this.tipoNota() === 'credito' ? ConceptosNotaCredito : ConceptosNotaDebito);
 conceptoActual = signal<string>('');
 isDraft = signal<boolean>(false);

 facturasDisponibles = signal<GetFacturaRequest[]>([]);
 itemsSeleccionados = signal<NotaAjusteItem[]>([]);
 facturaSeleccionada = signal<GetFacturaRequest | null>(null);
  disponibilidad = signal<DisponibilidadFactura | null>(null);
  /** Stock físico actual por artículo (kardex): solo informativo en devolución/anulación. */
  stockFisico = signal<Record<string, number>>({});
  refreshAsientoTrigger = signal<number>(0);

 // "Aplicar descuento a todo" (conceptos 3/5/6)
 tasaGlobal: number = 0;
 valorGlobal: number = 0;
 usoAplicarTodo = signal<boolean>(false);

 /** Config de grilla según concepto DIAN. */
 conceptoConfig = computed(() => {
  const c = this.conceptoActual();
  const esDescuento = c === '3' || c === '5' || c === '6';
  return {
   esDevolucion: c === '1',
   esAnulacion: c === '2',
   esDescuento,
   esAjustePrecio: c === '4',
   permiteCantidad: c === '1',
   permitePrecioNuevo: c === '4',
   permiteDescuento: esDescuento,
   permiteQuitar: c !== '2' && c !== '',
   muestraAplicarTodo: esDescuento,
  };
 });

 form = this.fb.group({
 facturaOriginalId: ['', Validators.required],
 facturaSearch: [''],
 tipo: ['credito', Validators.required],
 concepto: ['', Validators.required],
 esReembolsoAbono: [false],
 motivo: ['', [Validators.required, Validators.maxLength(1000)]],
 fecha: [new Date().toISOString().split('T')[0], Validators.required],
 observaciones: [''],
 });

  dispDe = (articuloId: string) => this.disponibilidad()?.lineas.find(l => l.articuloId === articuloId);
  stockDe = (articuloId: string) => this.stockFisico()[articuloId];

  /** Stock físico (kardex) para conceptos con efecto inventario (1/2). Informativo. */
  async cargarStockFisico() {
  const c = this.conceptoActual();
  if (c !== '1' && c !== '2') { this.stockFisico.set({}); return; }
  const ids = [...new Set((this.itemsSeleccionados() || []).map(i => i.articuloId).filter(Boolean))];
  if (!ids.length) { this.stockFisico.set({}); return; }
  const acc: Record<string, number> = {};
  await Promise.all(ids.map(async (id) => {
  try {
  const res = await firstValueFrom(this.inventarioService.getStock(id));
  if (res.success) acc[id] = Number((res.data as any)?.stock ?? 0);
  } catch { /* sin stock: se omite el hint */ }
  }));
  this.stockFisico.set(acc);
  }

 totales = computed(() => {
  const items = this.itemsSeleccionados();
  const cfg = this.conceptoConfig();
  let subtotal = 0;
  let totalDescuento = 0;
  let totalIVA = 0;

  items.forEach(item => {
   const qty = Number(item.cantidad) || 0;
   const price = Number(item.valorUnitario) || 0;
   const tasaIva = Number(item.porcentajeIVA) || 0;

   if (cfg.esDescuento) {
    // D por línea (tasa sobre base original o valor directo) + IVA(D)
    const base = (Number(item.cantidadOriginal) || qty) * (Number(item.precioOriginal) || price);
    const tasa = Number(item.descuento) || 0;
    const d = tasa > 0 ? base * (tasa / 100) : (Number(item.descuentoValor) || 0);
    const iva = d * (tasaIva / 100);
    subtotal += d;
    totalDescuento += d;
    totalIVA += iva;
   } else if (cfg.esAjustePrecio) {
    // difference = original − nuevo; base = diff × qty
    const orig = Number(item.precioOriginal) || price;
    const nuevo = item.precioNuevo !== undefined && item.precioNuevo !== null ? Number(item.precioNuevo) : orig;
    const diff = Math.max(0, orig - nuevo);
    const base = diff * qty;
    const iva = base * (tasaIva / 100);
    subtotal += base;
    totalIVA += iva;
   } else {
    // Devolución / anulación: qty × precio − desc + IVA
    const gross = qty * price;
    const discount = gross * ((Number(item.descuento) || 0) / 100);
    const afterDiscount = gross - discount;
    const iva = afterDiscount * (tasaIva / 100);
    subtotal += gross;
    totalDescuento += discount;
    totalIVA += iva;
   }
  });

  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  return {
   subtotal: round2(subtotal),
   descuento: round2(totalDescuento),
   iva: round2(totalIVA),
   total: round2(subtotal - (cfg.esDescuento || cfg.esAjustePrecio ? 0 : totalDescuento) + totalIVA)
  };
 });

 /** Monto acreditado de una línea (columna "Monto devuelto"). */
 montoDe(item: NotaAjusteItem): number {
  const cfg = this.conceptoConfig();
  const qty = Number(item.cantidad) || 0;
  const price = Number(item.valorUnitario) || 0;
  const tasaIva = Number(item.porcentajeIVA) || 0;
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  if (cfg.esDescuento) {
   const base = (Number(item.cantidadOriginal) || qty) * (Number(item.precioOriginal) || price);
   const tasa = Number(item.descuento) || 0;
   const d = tasa > 0 ? base * (tasa / 100) : (Number(item.descuentoValor) || 0);
   return round2(d * (1 + tasaIva / 100));
  }
  if (cfg.esAjustePrecio) {
   const orig = Number(item.precioOriginal) || price;
   const nuevo = item.precioNuevo !== undefined && item.precioNuevo !== null ? Number(item.precioNuevo) : orig;
   const base = Math.max(0, orig - nuevo) * qty;
   return round2(base * (1 + tasaIva / 100));
  }
  const gross = qty * price;
  const after = gross - gross * ((Number(item.descuento) || 0) / 100);
  return round2(after * (1 + tasaIva / 100));
 }

 diferenciaDe(item: NotaAjusteItem): number {
  const orig = Number(item.precioOriginal) || Number(item.valorUnitario) || 0;
  const nuevo = item.precioNuevo !== undefined && item.precioNuevo !== null ? Number(item.precioNuevo) : orig;
  return Math.round(((orig - nuevo) + Number.EPSILON) * 100) / 100;
 }

 ngOnInit(): void {
 this.loaderService.show();
 this.loadFacturas();

 const id = this.notaId();
 if (id && id !== 'new') {
 this.loadNota(id);
 } else {
 const fId = this.facturaIdFromQuery();
 if (fId) {
 this.onFacturaSeleccionadaById(fId);
 }
 this.loaderService.hide();
 }
 }

 loadFacturas() {
 this.ventasService.getComprobanteVentas({ limit: 100, page: 1, noStatus: 'draft' }).subscribe(res => {
 this.facturasDisponibles.set(res.data);
 });
 }

 loadNota(id: string) {
 this.notasService.getNotaAjusteById(id).subscribe({
 next: (res) => {
 try {
 const nota = res.data;
 this.form.patchValue({
 facturaSearch: nota.facturaOriginalNumero,
 facturaOriginalId: nota.facturaOriginalId,
 tipo: nota.tipo,
 concepto: nota.concepto,
 esReembolsoAbono: nota.esReembolsoAbono,
 motivo: nota.motivo,
 fecha: typeof nota.fecha === 'string' ? nota.fecha : new Date(nota.fecha).toISOString().split('T')[0],
 observaciones: nota.observaciones
 });
 this.tipoNota.set(nota.tipo);
 this.conceptoActual.set(nota.concepto || '');
 const mappedItems: NotaAjusteItem[] = (nota.items || []).map((item: any) => ({
  articuloId: item.articuloId,
  descripcion: item.articulo?.nombre || '',
  descuento: item.descuento,
  descuentoValor: item.descuentoValorInput ?? undefined,
  impuestoId: item.impuestoId,
  subtotal: item.subtotal,
  total: item.total,
  cantidad: item.cantidad,
  valorUnitario: item.valorUnitario,
  porcentajeIVA: item.porcentajeIVA,
  cantidadOriginal: item.cantidadOriginal ?? item.cantidad,
  precioOriginal: item.precioOriginal ?? item.valorUnitario,
  subtotalOriginal: item.subtotalOriginal,
  precioNuevo: item.precioNuevo ?? undefined,
 }));
 this.itemsSeleccionados.set(mappedItems);
 const factura = { ...nota.facturaOriginal, client: nota.cliente } as GetFacturaRequest;
  this.facturaSeleccionada.set(factura);
  this.cargarDisponibilidad(nota.facturaOriginalId);
  this.cargarStockFisico();
  this.loaderService.hide();
 } catch (error) {
 console.log('Error al cargar la nota de ajuste 2', error);
 this.loaderService.hide();
 this.notificationService.error('Error al cargar la nota de ajuste', 'Error');
 }
 },
 error: (error) => {
 console.log('Error al cargar la nota de ajuste 1', error);
 this.loaderService.hide();
 this.notificationService.error(error.error.message || 'Error al cargar la nota de ajuste', 'Error');
 }
 });

 }

 onFacturaSeleccionada(factura: GetFacturaRequest) {
 const f = factura;
 this.facturaSeleccionada.set(f);
 this.disponibilidad.set(null);
 this.usoAplicarTodo.set(false);
 this.isDraft.set(false);
 if (factura.tipoFactura == 'ESTANDAR') {
 this.isDraft.set(true);
 }
 this.form.patchValue({
 facturaOriginalId: f.id,
 facturaSearch: f.comprobante_completo,
 esReembolsoAbono: false
 });

  this.resetItemsPorConcepto();
  this.cargarDisponibilidad(f.id);
  this.cargarStockFisico();
  }

 cargarDisponibilidad(facturaId: string) {
 this.notasService.getDisponibilidad(facturaId).subscribe(res => {
 if (res.success && res.data) {
 this.disponibilidad.set(res.data);
 // Enriquecer líneas con disponibilidad
 this.itemsSeleccionados.update(items => items.map(it => {
 const d = res.data.lineas.find(l => l.articuloId === it.articuloId);
 if (!d) return it;
 return {
  ...it,
  cantidadDisponible: d.cantidadDisponible,
  descuentoDisponible: d.descuentoDisponible,
  ajusteDisponible: d.ajusteDisponible,
  // Clampar cantidad inicial al disponible en devolución
  cantidad: this.conceptoActual() === '1' ? Math.min(Number(it.cantidad) || 0, d.cantidadDisponible) : it.cantidad,
 };
 }));
 if (res.data.documento.bloqueada) {
 this.notificationService.error(
  res.data.documento.anulada
   ? 'La factura ya fue anulada: no admite más notas crédito.'
   : 'La factura no tiene saldo disponible para acreditar.',
  'Factura bloqueada'
 );
 }
 }
 });
 }

  /** Cambio de concepto DIAN: resetea la grilla a los valores de la factura. */
  onConceptoChange(concepto: string) {
  this.conceptoActual.set(concepto);
  this.form.patchValue({ concepto }, { emitEvent: false });
  this.usoAplicarTodo.set(false);
  this.resetItemsPorConcepto();
  this.cargarStockFisico();
  }

 /** Reconstruye las líneas desde la factura según el concepto activo. */
 resetItemsPorConcepto() {
 const f = this.facturaSeleccionada();
 if (!f) { this.itemsSeleccionados.set([]); return; }
 const c = this.conceptoActual();
 const items: NotaAjusteItem[] = (f.items || []).map((item: any) => {
 const disp = this.dispDe(item.articuloId);
 return {
 descripcion: item.articulo?.nombre || item.description || 'Ítem',
 articuloId: item.articuloId,
 impuestoId: item.impuestoId || undefined,
 cantidad: item.quantity,
 valorUnitario: item.unitPrice,
 porcentajeIVA: item.iva,
 descuento: 0,
 descuentoValor: 0,
 precioNuevo: c === '4' ? item.unitPrice : undefined,
 subtotal: item.quantity * item.unitPrice,
 total: 0,
 cantidadOriginal: item.quantity,
 precioOriginal: item.unitPrice,
 subtotalOriginal: item.quantity * item.unitPrice,
 cantidadDisponible: disp?.cantidadDisponible,
 descuentoDisponible: disp?.descuentoDisponible,
 ajusteDisponible: disp?.ajusteDisponible,
 };
 });
 this.itemsSeleccionados.set(items);
 }

 onFacturaSeleccionadaById(id: string) {
 this.ventasService.getInvoiceById(id).subscribe(res => {
 if (res.data && res.data[0]) {
 this.onFacturaSeleccionada(res.data[0]);
 }
 });
 }

 removeItem(index: number) {
 if (this.conceptoConfig().esAnulacion) return;
 this.itemsSeleccionados.update(items => items.filter((_, i) => i !== index));
 }

 /** Cantidad (solo concepto 1): 0 < q <= disponible. */
 updateCantidad(index: number, value: any) {
 const qty = Number(value);
 const items = this.itemsSeleccionados();
 const item = items[index];
 if (!item) return;
 const disp = this.dispDe(item.articuloId)?.cantidadDisponible;
 if (!(qty > 0)) {
 this.notificationService.error('La cantidad a devolver debe ser mayor a 0.', 'Validación');
 return;
 }
 if (disp !== undefined && qty > disp) {
 this.notificationService.error(`Cantidad máxima disponible: ${disp}.`, 'Validación');
 this.itemsSeleccionados.update(list => {
 const next = [...list];
 next[index] = { ...next[index], cantidad: disp };
 return next;
 });
 return;
 }
 this.itemsSeleccionados.update(list => {
 const next = [...list];
 next[index] = { ...next[index], cantidad: qty };
 return next;
 });
 }

 /** Precio nuevo (solo concepto 4): 0 <= p < original. */
 updatePrecioNuevo(index: number, value: any) {
 const p = Number(value);
 const items = this.itemsSeleccionados();
 const item = items[index];
 if (!item) return;
 const orig = Number(item.precioOriginal) || Number(item.valorUnitario) || 0;
 if (!Number.isFinite(p) || p < 0) {
 this.notificationService.error('Precio nuevo inválido.', 'Validación');
 return;
 }
 if (p >= orig) {
 this.notificationService.error(`El precio nuevo ($${p}) debe ser menor al original ($${orig}).`, 'Validación');
 return;
 }
 this.itemsSeleccionados.update(list => {
 const next = [...list];
 next[index] = { ...next[index], precioNuevo: p };
 return next;
 });
 }

 /** Descuento % (conceptos 3/5/6): D <= disponible. */
 updateDescuentoTasa(index: number, value: any) {
 const tasa = Number(value);
 const items = this.itemsSeleccionados();
 const item = items[index];
 if (!item) return;
 if (tasa < 0 || tasa > 100) {
 this.notificationService.error('La tasa debe estar entre 0 y 100%.', 'Validación');
 return;
 }
 const base = (Number(item.cantidadOriginal) || Number(item.cantidad) || 0) * (Number(item.precioOriginal) || Number(item.valorUnitario) || 0);
 const d = base * (tasa / 100);
 const disp = this.dispDe(item.articuloId)?.descuentoDisponible;
 if (disp !== undefined && d > disp) {
 this.notificationService.error(`Descuento máximo disponible: $${disp}.`, 'Validación');
 return;
 }
 this.usoAplicarTodo.set(false);
 this.itemsSeleccionados.update(list => {
 const next = [...list];
 next[index] = { ...next[index], descuento: tasa, descuentoValor: 0 };
 return next;
 });
 }

 /** Descuento $ (conceptos 3/5/6): D <= disponible. */
 updateDescuentoValor(index: number, value: any) {
 const d = Number(value);
 const items = this.itemsSeleccionados();
 const item = items[index];
 if (!item) return;
 if (!(d >= 0)) {
 this.notificationService.error('Descuento inválido.', 'Validación');
 return;
 }
 const disp = this.dispDe(item.articuloId)?.descuentoDisponible;
 if (disp !== undefined && d > disp) {
 this.notificationService.error(`Descuento máximo disponible: $${disp}.`, 'Validación');
 return;
 }
 this.usoAplicarTodo.set(false);
 this.itemsSeleccionados.update(list => {
 const next = [...list];
 next[index] = { ...next[index], descuento: 0, descuentoValor: d };
 return next;
 });
 }

 /** "Aplicar descuento a todo" (conceptos 3/5/6). */
 aplicarDescuentoATodo() {
 const tasa = Number(this.tasaGlobal) || 0;
 const valor = Number(this.valorGlobal) || 0;
 if (!(tasa > 0) && !(valor > 0)) {
 this.notificationService.error('Indique una tasa (%) o un valor ($) para aplicar a todo.', 'Validación');
 return;
 }
 if (tasa > 0 && valor > 0) {
 this.notificationService.error('Use tasa o valor, no ambos.', 'Validación');
 return;
 }
 // Validar contra disponibilidad antes de aplicar
 for (const it of this.itemsSeleccionados()) {
 const base = (Number(it.cantidadOriginal) || 0) * (Number(it.precioOriginal) || 0);
 const d = valor > 0 ? valor : base * (tasa / 100);
 const disp = this.dispDe(it.articuloId)?.descuentoDisponible;
 if (disp !== undefined && d > disp) {
 this.notificationService.error(`"${it.descripcion}" excede su descuento disponible ($${disp}).`, 'Validación');
 return;
 }
 }
 this.itemsSeleccionados.update(list => list.map(it => ({
 ...it,
 descuento: valor > 0 ? 0 : tasa,
 descuentoValor: valor > 0 ? valor : 0,
 })));
 this.usoAplicarTodo.set(true);
 this.notificationService.success('Descuento aplicado a todas las líneas.', 'Completado');
 }

 validarFormulario(): string | null {
 if (this.form.invalid) return 'Por favor completa todos los campos.';
 if (!this.facturaSeleccionada()) return 'Seleccione una factura.';
 const c = this.conceptoActual();
 if (!c) return 'Seleccione el concepto DIAN.';
 const items = this.itemsSeleccionados();
 if (c !== '2' && items.length === 0) return 'La nota no tiene ítems.';
 if (c === '2' && items.length === 0) return 'La factura no tiene ítems para anular.';

 if (c === '1') {
 for (const it of items) {
 const q = Number(it.cantidad) || 0;
 const disp = this.dispDe(it.articuloId)?.cantidadDisponible;
 if (!(q > 0)) return `Cantidad inválida en "${it.descripcion}".`;
 if (disp !== undefined && q > disp) return `"${it.descripcion}" excede lo disponible (${disp}).`;
 }
 }
 if (c === '3' || c === '5' || c === '6') {
 if (!this.usoAplicarTodo()) {
 for (const it of items) {
 const tasa = Number(it.descuento) || 0;
 const val = Number(it.descuentoValor) || 0;
 if (!(tasa > 0) && !(val > 0)) return `Indique descuento en "${it.descripcion}".`;
 }
 }
 }
 if (c === '4') {
 for (const it of items) {
 const orig = Number(it.precioOriginal) || 0;
 const p = Number(it.precioNuevo);
 if (!Number.isFinite(p) || p < 0 || p >= orig) return `Precio nuevo inválido en "${it.descripcion}".`;
 }
 }
 const dispDoc = this.disponibilidad()?.documento;
 if (dispDoc && this.totales().total > dispDoc.saldoDisponible) {
 return `El total ($${this.totales().total}) excede el saldo disponible ($${dispDoc.saldoDisponible}).`;
 }
 return null;
 }

 onSubmit(isDraft: boolean) {
 const error = this.validarFormulario();
 if (error) {
 this.form.markAllAsTouched();
 this.notificationService.error(error, 'Formulario inválido');
 return;
 }

 this.loaderService.show();
 const c = this.conceptoActual();
 const t = this.totales();

 const data: CreateNotaCreditoV2 = {
 isDraft,
 facturaOriginalId: this.form.value.facturaOriginalId!,
 concepto: c,
 motivo: this.form.value.motivo!,
 fecha: this.form.value.fecha!,
 esReembolsoAbono: this.form.value.esReembolsoAbono ?? false,
 observaciones: this.form.value.observaciones || undefined,
 };

 if (c === '2') {
 data.items = [];
 } else if ((c === '3' || c === '5' || c === '6') && this.usoAplicarTodo()) {
 data.aplicarDescuentoATodo = true;
 if (Number(this.tasaGlobal) > 0) data.descuentoTasaGlobal = Number(this.tasaGlobal);
 if (Number(this.valorGlobal) > 0) data.descuentoValorGlobal = Number(this.valorGlobal);
 data.items = [];
 } else {
 data.items = this.itemsSeleccionados().map(it => {
 const base: any = { articuloId: it.articuloId };
 if (c === '1') base.cantidad = Number(it.cantidad);
 if (c === '4') base.precioNuevo = Number(it.precioNuevo);
 if (c === '3' || c === '5' || c === '6') {
 if (Number(it.descuentoValor) > 0) base.descuentoValor = Number(it.descuentoValor);
 else base.descuentoTasa = Number(it.descuento) || 0;
 }
 return base;
 });
 }

 // Log de auditoría: lo que verá el backend como fuente de verdad
 console.log('[NC V2] concepto', c, 'totales', t, 'payload', data);

 const id = this.notaId();
 // Los borradores V2 se editan por /v2 (recálculo por concepto en backend).
 const request = (id && id !== 'new')
 ? this.notasService.updateNotaCreditoV2(id, data)
 : this.notasService.createNotaCreditoV2(data);

 request.subscribe({
 next: (res) => {
 this.loaderService.hide();
 if (res.success) {
 this.notificationService.success('Nota guardada con éxito', 'Completado');
 if (isDraft) {
  if (this.notaId() === 'new' || !this.notaId()) {
   this.router.navigate(['/panel/ventas/notas-ajuste', (res.data as any).id]);
  } else {
   this.refreshAsientoTrigger.update(v => v + 1);
  }
 } else {
  this.router.navigate(['/panel/ventas/notas-ajuste']);
 }
 } else {
 const message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
 this.notificationService.error(message || (res as any).error?.error?.message || 'Error al guardar la nota', 'Error');
 }
 },
 error: () => this.loaderService.hide()
 });
 }
}
