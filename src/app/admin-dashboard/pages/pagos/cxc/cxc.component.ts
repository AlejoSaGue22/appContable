import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import {
  debounceTime,
  distinctUntilChanged,
  map,
  startWith,
} from 'rxjs/operators';
import {
  RegistrarPagoModalComponent,
  RegistrarPagoModalData,
} from '../components/modal-registrarpago/modal-registrarpago.component';
import {
  CxcItem,
  CxcResumen,
  PagoHistorial,
  PaymentStatus,
  MovimientoItem,
  MovimientosResponse,
} from '@dashboard/interfaces/pagos-interface';
import { PagosHttpService } from '../services/pagos.service';
import { ModalComponent } from '@shared/components/modal/modal.component';
import {
  HeaderInput,
  HeaderTitlePageComponent,
} from '@dashboard/components/header-title-page/header-title-page.component';
import { ModalHistorialpagoComponent } from '../components/modal-historialpago/modal-historialpago..component';
import { TarjetasResumenPagos } from '../components/tarjetas-resumen-pagos/tarjetas-resumen-pagos.component';
import { PaginationComponent } from '@shared/components/pagination/pagination';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { ModalAsientoContableComponent } from '../components/modal-asiento-contable/modal-asiento-contable.component';
import { VolantePagoComponent } from '../components/volante-pago/volante-pago.component';
import { EstadoCuentaComponent } from '../components/estado-cuenta/estado-cuenta.component';
import { TabsComponent, TabItem } from '@shared/components/tabs/tabs.component';

@Component({
  selector: 'app-cxc',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    RegistrarPagoModalComponent,
    ModalComponent,
    HeaderTitlePageComponent,
    ModalHistorialpagoComponent,
    TarjetasResumenPagos,
    PaginationComponent,
    ModalAsientoContableComponent,
    VolantePagoComponent,
    EstadoCuentaComponent,
    TabsComponent,
  ],
  templateUrl: './cxc.component.html',
})
export class CxcComponent implements OnInit {
  private paginationService = inject(PaginationService);
  headTitle = signal<HeaderInput>({
    title: 'Cuentas por Cobrar',
    slog: 'Facturas de venta a crédito pendientes de pago',
  });

  activeTab = signal<string>('facturas');
  tabItems: TabItem[] = [
    { id: 'facturas', label: 'Facturas Pendientes' },
    { id: 'cobros', label: 'Pagos Realizados' },
    { id: 'estado-cuenta', label: 'Estado de Cuenta' },
  ];

  // ── Tab Facturas ─────────────────────────────────────────────────────
  private todosLosItems = signal<CxcItem[]>([]);
  resumen = signal<CxcResumen>({
    totalCartera: 0,
    porVencer: 0,
    vencida: 0,
    cantidadPorVencer: 0,
    cantidadVencida: 0,
  });
  loading = signal(false);

  filtroTexto = new FormControl('');
  filtroEstado = new FormControl<PaymentStatus | ''>('');

  textoSignal = toSignal(
    this.filtroTexto.valueChanges.pipe(
      startWith(''),
      map((v) => v?.toLowerCase().trim() ?? ''),
    ),
  );
  estadoSignal = toSignal(this.filtroEstado.valueChanges.pipe(startWith('')));

  itemsFiltrados = computed(() => {
    const texto = this.textoSignal();
    const estado = this.estadoSignal();

    return this.todosLosItems().filter((item) => {
      const pasaTexto =
        !texto ||
        item.clienteNombre.toLowerCase().includes(texto) ||
        item.numeroFactura.toLowerCase().includes(texto);
      const pasaEstado = !estado || item.paymentStatus === estado;
      return pasaTexto && pasaEstado;
    });
  });

  // Modal cobro
  modalVisible = false;
  modalData: RegistrarPagoModalData | null = null;

  // Modal historial
  historialVisible = false;
  historialLoading = false;
  historialItem: CxcItem | null = null;
  historialPagos: PagoHistorial[] = [];

  // ── Tab Cobros ───────────────────────────────────────────────────────
  cobrosData = signal<MovimientosResponse>({
    items: [],
    resumen: { totalCobros: 0, totalPagos: 0, neto: 0 },
    meta: { page: 1, limit: 20, total: 0, totalPages: 1 },
  });
  cobrosLoading = signal(false);
  cobrosFiltroTexto = new FormControl('');

  // ── Modal Asiento ────────────────────────────────────────────────────
  asientoVisible = false;
  asientoPagoId = signal<string | null>(null);

  // ── Volante ──────────────────────────────────────────────────────────
  volanteVisible = false;
  volanteItem = signal<MovimientoItem | null>(null);

  constructor(private svc: PagosHttpService) { }

  ngOnInit(): void {
    this.cargar();
    this.filtroEstado.valueChanges.subscribe(() => { });
    this.filtroTexto.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe(() => { });
  }

  cambiarTab(tab: string): void {
    this.activeTab.set(tab);
    if (tab === 'cobros' && this.cobrosData().items.length === 0) {
      this.cargarCobros();
    }
  }

  cargar(): void {
    this.loading.set(true);
    const estado = this.filtroEstado.value || undefined;

    this.svc
      .getCxc({
        paymentStatus: estado,
        page: this.paginationService.currentPage(),
        limit: 10,
      })
      .subscribe({
        next: (res) => {
          this.todosLosItems.set(res.items);
          this.resumen.set(res.resumen);
          this.loading.set(false);
          this.paginationService.totalItems.set(res.meta.total);
          this.paginationService.pageSize.set(res.meta.totalPages);
        },
        error: () => {
          this.loading.set(false);
        },
      });
  }

  cargarCobros(): void {
    this.cobrosLoading.set(true);
    this.svc
      .getMovimientos({
        tipo: 'cobro,otro_ingreso',
        busqueda: this.cobrosFiltroTexto.value?.trim() || undefined,
        page: this.paginationService.currentPage(),
        limit: 10,
      })
      .subscribe({
        next: (res) => {
          this.cobrosData.set(res);
          this.cobrosLoading.set(false);
          this.paginationService.totalItems.set(res.meta.total);
          this.paginationService.pageSize.set(res.meta.totalPages);
        },
        error: () => this.cobrosLoading.set(false),
      });
  }

  abrirCobro(item: CxcItem): void {
    this.modalData = {
      tipo: 'cobro',
      documentoId: item.facturaId,
      numeroDocumento: item.numeroFactura,
      contraparte: item.clienteNombre,
      total: item.total,
      saldoPendiente: item.saldoPendiente,
    };
    this.modalVisible = true;
  }

  abrirHistorial(item: CxcItem): void {
    this.historialItem = item;
    this.historialPagos = [];
    this.historialVisible = true;
    this.historialLoading = true;
    this.svc.getHistorialCobros(item.facturaId).subscribe({
      next: (pagos) => {
        this.historialPagos = pagos;
        this.historialLoading = false;
      },
      error: () => {
        this.historialLoading = false;
      },
    });
  }

  onCobroExitoso(_result: any): void {
    this.modalVisible = false;
    this.modalData = null;
    this.cargar();
    if (this.activeTab() === 'cobros') this.cargarCobros();
  }

  verAsiento(pagoId: string): void {
    this.asientoPagoId.set(pagoId);
    this.asientoVisible = true;
  }

  imprimirVolante(item: MovimientoItem): void {
    this.volanteItem.set(item);
    this.volanteVisible = true;
  }

  etiquetaEstado(status: PaymentStatus): string {
    const map: Record<PaymentStatus, string> = {
      pendiente: 'Pendiente',
      parcial: 'Parcial',
      pagado: 'Pagado',
      vencido: 'Vencido',
    };
    return map[status] ?? status;
  }

  etiquetaMedio(medio: string): string {
    const labels: Record<string, string> = {
      caja: 'Caja',
      banco: 'Banco',
      transferencia: 'Transferencia',
      cheque: 'Cheque',
    };
    return labels[medio] ?? medio;
  }
}
