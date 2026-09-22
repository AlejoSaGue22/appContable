import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import {
  HeaderTitlePageComponent,
  HeaderInput,
} from '@dashboard/components/header-title-page/header-title-page.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { LoaderComponent } from '@utils/components/loader/loader.component';
import { NotificationService } from '@shared/services/notification.service';
import { HelpersUtils } from '@utils/helpers.utils';
import { NumberingRangesService } from './services/numbering-ranges.service';
import {
  HEALTH_LABELS,
  NumberingRange,
  NumberingRangeDomain,
  RangeHealth,
  consumptionPercent,
  documentLabel,
  rangeHealth,
  remainingNumbers,
  validityDaysLeft,
} from './interfaces/numbering-range.interface';

type ModalMode = 'detail' | 'create' | 'current' | 'confirm' | null;
type ConfirmAction = 'delete' | 'toggle' | null;

@Component({
  selector: 'app-rangos-dian',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderTitlePageComponent, BreadcrumbComponent, ModalComponent, LoaderComponent],
  templateUrl: './rangos-dian.component.html',
})
export class RangosDianComponent implements OnInit {
  private rangesService = inject(NumberingRangesService);
  private notificationService = inject(NotificationService);

  headTitle = signal<HeaderInput>({
    title: 'Rangos de numeración DIAN',
    slog: 'Resoluciones y consecutivos sincronizados desde Factus. La emisión usa este caché sin llamar a la API.',
  });

  breadcrumbItems = [
    { label: 'Configuración', route: '/panel/admin/settings' },
    { label: 'Rangos DIAN' },
  ];

  domain = signal<NumberingRangeDomain>('billing');
  documentFilter = signal<string>('');
  healthFilter = signal<string>('');
  ranges = signal<NumberingRange[]>([]);
  loading = signal<boolean>(false);
  syncing = signal<boolean>(false);
  processing = signal<boolean>(false);

  modalMode = signal<ModalMode>(null);
  selected = signal<NumberingRange | null>(null);
  confirmAction = signal<ConfirmAction>(null);
  rawJson = signal<string>('');

  // Form crear rango (se envía tal cual a Factus)
  newRange = signal({
    document: 'Factura de Venta',
    prefix: '',
    from: '',
    to: '',
    resolution_number: '',
    technical_key: '',
    start_date: '',
    end_date: '',
  });
  newCurrent = signal<string>('');

  updateNewRangeField(field: string, value: any): void {
    this.newRange.update((v) => ({ ...v, [field]: value }));
  }

  readonly HEALTH_LABELS = HEALTH_LABELS;

  filtered = computed(() => {
    const doc = this.documentFilter();
    const health = this.healthFilter();
    return this.ranges().filter((r) => {
      if (doc && (r.document ?? '') !== doc) return false;
      if (health && rangeHealth(r) !== health) return false;
      return true;
    });
  });

  documentsAvailable = computed(() => {
    const set = new Set<string>();
    for (const r of this.ranges()) {
      if (r.document) set.add(r.document);
    }
    return [...set].sort();
  });

  ngOnInit(): void {
    this.loadData();
  }

  setDomain(d: NumberingRangeDomain): void {
    if (this.domain() === d) return;
    this.domain.set(d);
    this.documentFilter.set('');
    this.healthFilter.set('');
    this.loadData();
  }

  async loadData(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.rangesService.list({ domain: this.domain() }));
      this.ranges.set(res.data ?? []);
    } catch (error: any) {
      this.notificationService.error(
        `Error al cargar rangos: ${this.errorMessage(error)}`,
        'Error',
      );
    } finally {
      this.loading.set(false);
    }
  }

  async onSync(): Promise<void> {
    this.syncing.set(true);
    try {
      const res = await firstValueFrom(this.rangesService.sync(this.domain()));
      const detail = Object.entries(res.data ?? {})
        .map(([d, r]) => `${d}: ${r.error ? `error (${r.error})` : `${r.synced} sincronizados`}`)
        .join(' · ');
      this.notificationService.success(`Sincronización completada. ${detail}`, 'Rangos DIAN');
      await this.loadData();
    } catch (error: any) {
      this.notificationService.error(`Error al sincronizar: ${this.errorMessage(error)}`, 'Error');
    } finally {
      this.syncing.set(false);
    }
  }

  openDetail(r: NumberingRange): void {
    this.selected.set(r);
    this.rawJson.set(JSON.stringify(r.rawJson ?? r, null, 2));
    this.modalMode.set('detail');
  }

  async onRefreshOne(r: NumberingRange): Promise<void> {
    this.processing.set(true);
    try {
      const res = await firstValueFrom(this.rangesService.getById(r.factusId, r.domain, true));
      if (res.data) {
        this.notificationService.success(`Rango ${r.factusId} actualizado desde Factus`, 'Rangos DIAN');
        await this.loadData();
      }
    } catch (error: any) {
      this.notificationService.error(`Error al actualizar: ${this.errorMessage(error)}`, 'Error');
    } finally {
      this.processing.set(false);
    }
  }

  openCreate(): void {
    this.newRange.set({
      document: 'Factura de Venta',
      prefix: '',
      from: '',
      to: '',
      resolution_number: '',
      technical_key: '',
      start_date: '',
      end_date: '',
    });
    this.modalMode.set('create');
  }

  async onCreate(): Promise<void> {
    const f = this.newRange();
    const payload: Record<string, unknown> = { document: f.document };
    if (f.prefix) payload['prefix'] = f.prefix;
    if (f.from !== '') payload['from'] = Number(f.from);
    if (f.to !== '') payload['to'] = Number(f.to);
    if (f.resolution_number) payload['resolution_number'] = f.resolution_number;
    if (f.technical_key) payload['technical_key'] = f.technical_key;
    if (f.start_date) payload['start_date'] = f.start_date;
    if (f.end_date) payload['end_date'] = f.end_date;

    this.processing.set(true);
    try {
      const res = await firstValueFrom(this.rangesService.create(this.domain(), payload));
      this.notificationService.success(res.message || 'Rango creado en Factus', 'Rangos DIAN');
      this.modalMode.set(null);
      await this.loadData();
    } catch (error: any) {
      this.notificationService.error(`Error al crear: ${this.errorMessage(error)}`, 'Error');
    } finally {
      this.processing.set(false);
    }
  }

  openCurrent(r: NumberingRange): void {
    this.selected.set(r);
    this.newCurrent.set(r.currentNumber !== null && r.currentNumber !== undefined ? String(r.currentNumber) : '');
    this.modalMode.set('current');
  }

  async onUpdateCurrent(): Promise<void> {
    const r = this.selected();
    if (!r) return;
    this.processing.set(true);
    try {
      const res = await firstValueFrom(
        this.rangesService.updateCurrent(r.factusId, Number(this.newCurrent()), r.domain),
      );
      this.notificationService.success(res.message || 'Consecutivo actualizado', 'Rangos DIAN');
      this.modalMode.set(null);
      await this.loadData();
    } catch (error: any) {
      this.notificationService.error(`Error al actualizar: ${this.errorMessage(error)}`, 'Error');
    } finally {
      this.processing.set(false);
    }
  }

  openConfirm(r: NumberingRange, action: ConfirmAction): void {
    this.selected.set(r);
    this.confirmAction.set(action);
    this.modalMode.set('confirm');
  }

  async onConfirm(): Promise<void> {
    const r = this.selected();
    const action = this.confirmAction();
    if (!r || !action) return;
    this.processing.set(true);
    try {
      if (action === 'delete') {
        const res = await firstValueFrom(this.rangesService.remove(r.factusId, r.domain));
        this.notificationService.success(res.message || 'Rango eliminado', 'Rangos DIAN');
      } else {
        const res = await firstValueFrom(this.rangesService.toggleStatus(r.factusId, r.domain));
        this.notificationService.success(res.message || 'Estado actualizado', 'Rangos DIAN');
      }
      this.modalMode.set(null);
      this.confirmAction.set(null);
      await this.loadData();
    } catch (error: any) {
      this.notificationService.error(`Error en la operación: ${this.errorMessage(error)}`, 'Error');
    } finally {
      this.processing.set(false);
    }
  }

  closeModal(): void {
    if (this.processing()) return;
    this.modalMode.set(null);
    this.confirmAction.set(null);
    this.selected.set(null);
  }

  // ---- helpers de presentación ----
  docLabel = documentLabel;
  healthOf = rangeHealth;
  pctOf = consumptionPercent;
  remainingOf = remainingNumbers;
  daysLeftOf = validityDaysLeft;

  healthBadge(h: RangeHealth): string {
    switch (h) {
      case 'ok':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-amber-100 text-amber-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  rangeSpan(r: NumberingRange): string {
    if (r.fromNumber === null || r.toNumber === null) return 'Sin rango (Factus asigna)';
    return `${r.fromNumber.toLocaleString()} – ${r.toNumber.toLocaleString()}`;
  }

  fmtDate(v: string | null): string {
    if (!v) return '—';
    return v.slice(0, 10);
  }

  fmtDateTime(v: string | null): string {
    if (!v) return '—';
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return v;
    return d.toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
  }

  private errorMessage(error: any): string {
    const msg = error?.error?.message ?? error?.message;
    return HelpersUtils.getMessageError(msg ?? 'Error desconocido');
  }
}
