import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { map, startWith, debounceTime, distinctUntilChanged } from 'rxjs';
import { PagosHttpService } from '../services/pagos.service';
import { MovimientoItem, MovimientosResponse, MedioPago, TipoPago } from '@dashboard/interfaces/pagos-interface';
import { HeaderTitlePageComponent, HeaderInput } from '@dashboard/components/header-title-page/header-title-page.component';
import { PaginationComponent } from '@shared/components/pagination/pagination';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { ModalAsientoContableComponent } from '../components/modal-asiento-contable/modal-asiento-contable.component';
import { VolantePagoComponent } from '../components/volante-pago/volante-pago.component';

@Component({
    selector: 'app-movimientos',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        HeaderTitlePageComponent,
        PaginationComponent,
        ModalComponent,
        ModalAsientoContableComponent,
        VolantePagoComponent,
    ],
    templateUrl: './movimientos.component.html',
})
export class MovimientosComponent {
    private svc = inject(PagosHttpService);
    private paginationService = inject(PaginationService);

    headTitle = signal<HeaderInput>({
        title: 'Movimientos Financieros',
        slog: 'Consulta el historial de ingresos y egresos registrados.',
    });

    rawData = signal<MovimientosResponse>({
        items: [],
        resumen: { totalCobros: 0, totalPagos: 0, neto: 0 },
        meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
    });
    loading = signal(false);

    filtroTexto = new FormControl('');
    filtroTipo = new FormControl<TipoPago | ''>('');
    filtroMedio = new FormControl<MedioPago | ''>('');
    filtroFechaInicio = new FormControl('');
    filtroFechaFin = new FormControl('');

    textoSignal = toSignal(
        this.filtroTexto.valueChanges.pipe(
            startWith(''),
            debounceTime(300),
            distinctUntilChanged(),
            map(v => v?.trim() ?? ''),
        ),
    );
    tipoSignal = toSignal(this.filtroTipo.valueChanges.pipe(startWith('')));
    medioSignal = toSignal(this.filtroMedio.valueChanges.pipe(startWith('')));

    resumen = computed(() => this.rawData().resumen);

    constructor() {
        this.cargar();
    }

    cargar(): void {
        this.loading.set(true);
        this.svc
            .getMovimientos({
                tipo: this.filtroTipo.value || undefined,
                medioPago: this.filtroMedio.value || undefined,
                busqueda: this.filtroTexto.value?.trim() || undefined,
                fechaInicio: this.filtroFechaInicio.value || undefined,
                fechaFin: this.filtroFechaFin.value || undefined,
                page: this.paginationService.currentPage(),
                limit: 20,
            })
            .subscribe({
                next: res => {
                    this.rawData.set(res);
                    this.loading.set(false);
                    this.paginationService.totalItems.set(res.meta.total);
                    this.paginationService.pageSize.set(res.meta.totalPages);
                },
                error: () => this.loading.set(false),
            });
    }

    limpiarFiltros(): void {
        this.filtroTexto.setValue('', { emitEvent: false });
        this.filtroTipo.setValue('', { emitEvent: false });
        this.filtroMedio.setValue('', { emitEvent: false });
        this.filtroFechaInicio.setValue('', { emitEvent: false });
        this.filtroFechaFin.setValue('', { emitEvent: false });
        this.cargar();
    }

    // ── Modal Asiento Contable ──────────────────────────────────────────────
    asientoVisible = false;
    asientoPagoId = signal<string | null>(null);

    verAsiento(item: MovimientoItem): void {
        if (!item.asientoId) return;
        this.asientoPagoId.set(item.id);
        this.asientoVisible = true;
    }

    // ── Anulación de Pagos ──────────────────────────────────────────────────
    anularVisible = false;
    anularLoading = signal(false);
    paymentToAnul = signal<MovimientoItem | null>(null);
    motivoAnulacionCtrl = new FormControl('');

    abrirModalAnular(item: MovimientoItem): void {
        this.paymentToAnul.set(item);
        this.motivoAnulacionCtrl.setValue('');
        this.anularVisible = true;
    }

    confirmarAnular(): void {
        const item = this.paymentToAnul();
        const motivo = this.motivoAnulacionCtrl.value?.trim();
        if (!item || !motivo) return;

        this.anularLoading.set(true);
        this.svc.anularPago(item.id, motivo).subscribe({
            next: () => {
                this.anularLoading.set(false);
                this.anularVisible = false;
                alert('El pago ha sido anulado exitosamente.');
                this.cargar();
            },
            error: (err) => {
                this.anularLoading.set(false);
                alert(err?.error?.message || 'Error al intentar anular el pago.');
            }
        });
    }

    // ── Volante de Pago ─────────────────────────────────────────────────────
    volanteVisible = false;
    volanteItem = signal<MovimientoItem | null>(null);

    imprimirVolante(item: MovimientoItem): void {
        this.volanteItem.set(item);
        this.volanteVisible = true;
    }

    etiquetaMedio(medio: MedioPago): string {
        const labels: Record<MedioPago, string> = {
            caja: 'Caja',
            banco: 'Banco',
            transferencia: 'Transferencia',
            cheque: 'Cheque',
        };
        return labels[medio] ?? medio;
    }

    formatCuentaBancaria(item: MovimientoItem): string {
        if (!item.cuentaBancaria) return '—';
        const banco = item.cuentaBancaria.banco?.nombre ?? '';
        return `${banco} - ${item.cuentaBancaria.numeroCuenta}`;
    }

    isIngreso(tipo: TipoPago | string): boolean {
        return tipo === 'cobro' || tipo === 'otro_ingreso';
    }
}
