// cxc.component.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, map, startWith } from 'rxjs/operators';
import { RegistrarPagoModalComponent, RegistrarPagoModalData } from '../components/modal-registrarpago/modal-registrarpago.component';
import { CxcItem, CxcResumen, PagoHistorial, PaymentStatus } from '@dashboard/interfaces/pagos-interface';
import { PagosHttpService } from '../services/pagos.service';
import { ModalComponent } from "@shared/components/modal/modal.component";
import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { ModalHistorialpagoComponent } from "../components/modal-historialpago/modal-historialpago..component";
import { TarjetasResumenPagos } from "../components/tarjetas-resumen-pagos/tarjetas-resumen-pagos.component";
import { PaginationComponent } from "@shared/components/pagination/pagination";
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-cxc',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RegistrarPagoModalComponent,
    ModalComponent,
    HeaderTitlePageComponent,
    ModalHistorialpagoComponent,
    TarjetasResumenPagos,
    PaginationComponent
],
  templateUrl: './cxc.component.html',
})
export class CxcComponent implements OnInit {

  private paginationService = inject(PaginationService);
  headTitle = signal<HeaderInput>({ title: 'Cuentas por Cobrar', slog: 'Facturas de venta a crédito pendientes de pago' });

  // Estado
  private todosLosItems = signal<CxcItem[]>([]);
  resumen = signal<CxcResumen>({ totalCartera: 0, porVencer: 0, vencida: 0, cantidadPorVencer: 0, cantidadVencida: 0 });
  loading = signal(false);  

  // Filtros
  filtroTexto  = new FormControl('');
  filtroEstado = new FormControl<PaymentStatus | ''>('');

  textoSignal = toSignal(this.filtroTexto.valueChanges.pipe(startWith(''), map(v => v?.toLowerCase().trim() ?? '')));
  estadoSignal = toSignal(this.filtroEstado.valueChanges.pipe(startWith('')));

  // Items filtrados en el template (calculado al vuelo)
  itemsFiltrados = computed(() => {
    const texto  = this.textoSignal();
    const estado = this.estadoSignal();

    return this.todosLosItems().filter(item => {
      const pasaTexto  = !texto  || item.clienteNombre.toLowerCase().includes(texto) || item.numeroFactura.toLowerCase().includes(texto);
      const pasaEstado = !estado || item.paymentStatus === estado;
      return pasaTexto && pasaEstado;
    });
  
  });

  // Modal cobro
  modalVisible = false;
  modalData: RegistrarPagoModalData | null = null;

  // Modal historial
  historialVisible  = false;
  historialLoading  = false;
  historialItem: CxcItem | null = null;
  historialPagos: PagoHistorial[] = [];

  constructor(private svc: PagosHttpService) {}

  ngOnInit(): void {
    this.cargar();
    this.filtroEstado.valueChanges.subscribe(() => {}); // fuerza re-render
    this.filtroTexto.valueChanges
      .pipe(debounceTime(250), distinctUntilChanged())
      .subscribe(() => {});
  }

  cargar(): void {
    this.loading.set(true);
    const estado = this.filtroEstado.value || undefined;

    this.svc.getCxc({ paymentStatus: estado, page: this.paginationService.currentPage() - 1, limit: 10 }).subscribe({
      next: res => {
        this.todosLosItems.set(res.items);
        this.resumen.set(res.resumen);
        this.loading.set(false);
        this.paginationService.totalItems.set(res.meta.total);
        this.paginationService.pageSize.set(res.meta.totalPages);
      },
      error: () => { this.loading.set(false); },
    });
  }

  abrirCobro(item: CxcItem): void {
    this.modalData = {
      tipo:            'cobro',
      documentoId:     item.facturaId,
      numeroDocumento: item.numeroFactura,
      contraparte:     item.clienteNombre,
      total:           item.total,
      saldoPendiente:  item.saldoPendiente,
    };
    this.modalVisible = true;
  }

  abrirHistorial(item: CxcItem): void {
    this.historialItem    = item;
    this.historialPagos   = [];
    this.historialVisible = true;
    this.historialLoading = true;
    this.svc.getHistorialCobros(item.facturaId).subscribe({
      next: pagos => { this.historialPagos = pagos; this.historialLoading = false; },
      error: ()   => { this.historialLoading = false; },
    });
  }

  onCobroExitoso(_result: any): void {
    this.modalVisible = false;
    this.modalData    = null;
    this.cargar(); // refresca la lista
  }

  etiquetaEstado(status: PaymentStatus): string {
    const map: Record<PaymentStatus, string> = {
      pendiente: 'Pendiente', parcial: 'Parcial',
      pagado: 'Pagado', vencido: 'Vencido',
    };
    return map[status] ?? status;
  }
}
