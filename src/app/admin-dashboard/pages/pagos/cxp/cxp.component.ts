import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { RegistrarPagoModalComponent, RegistrarPagoModalData } from '../components/modal-registrarpago/modal-registrarpago.component';
import { CxpItem, CxpResumen, PagoHistorial, PaymentStatus } from '@dashboard/interfaces/pagos-interface';
import { PagosHttpService } from '../services/pagos.service';
import { ModalComponent } from "@shared/components/modal/modal.component";
import { HeaderTitlePageComponent, HeaderInput } from "@dashboard/components/header-title-page/header-title-page.component";
import { ModalHistorialpagoComponent } from "../components/modal-historialpago/modal-historialpago..component";
import { TarjetasResumenPagos } from "../components/tarjetas-resumen-pagos/tarjetas-resumen-pagos.component";
import { map, startWith } from 'rxjs';
import { PaginationComponent } from "@shared/components/pagination/pagination";
import { PaginationService } from '@shared/components/pagination/pagination.service';

@Component({
  selector: 'app-cxp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RegistrarPagoModalComponent, ModalComponent, HeaderTitlePageComponent, ModalHistorialpagoComponent,
          TarjetasResumenPagos, PaginationComponent],
  templateUrl: './cxp.component.html',
})
export class CxpComponent {
  private svc = inject(PagosHttpService);
  private paginationService = inject(PaginationService);

  headTitle = signal<HeaderInput> ({
    title: 'Cuentas por Pagar',
    slog: 'Facturas de compra a crédito pendientes de pago'
  });

  // State
  private rawData = signal<{ items: CxpItem[], resumen: CxpResumen }>({ items: [], resumen: { totalPorPagar: 0, porVencer: 0, vencida: 0, cantidadPorVencer: 0, cantidadVencida: 0 } });
  loading = signal(false);

  // Filters using Signals
  filtroTexto = new FormControl('');
  filtroEstado = new FormControl<PaymentStatus | ''>('');
  
  textoSignal = toSignal(this.filtroTexto.valueChanges.pipe(startWith(''), map(v => v?.toLowerCase().trim() ?? '')));
  estadoSignal = toSignal(this.filtroEstado.valueChanges.pipe(startWith('')));

  resumen = computed(() => this.rawData().resumen);

  itemsFiltrados = computed(() => {
    const texto = this.textoSignal();
    const estado = this.estadoSignal();
    const items = this.rawData().items;

    if (!texto && !estado) return items;

    return items.filter(item => {
      const pasaTexto = !texto || item.proveedorNombre.toLowerCase().includes(texto) || item.numeroFactura.toLowerCase().includes(texto);
      const pasaEstado = !estado || item.paymentStatus === estado;
      return pasaTexto && pasaEstado;
    });
  });

  // Modal logic
  modalVisible = false;
  modalData: RegistrarPagoModalData | null = null;
  historialVisible = false;
  historialLoading = false;
  historialItem = signal<CxpItem | null>(null);
  historialPagos = signal<PagoHistorial[]>([]);

  constructor() {
    this.cargar();
  }

  cargar(): void {
    this.loading.set(true);
    const currentEstado = this.filtroEstado.value || undefined;
    this.svc.getCxp({ paymentStatus: currentEstado, page: this.paginationService.currentPage() - 1, limit: 10 }).subscribe({
      next: res => { 
        this.rawData.set({ items: res.items, resumen: res.resumen }); 
        this.loading.set(false); 
        this.paginationService.totalItems.set(res.meta.total);
        this.paginationService.pageSize.set(res.meta.totalPages);
      },
      error: () => this.loading.set(false),
    });
  }

  abrirPago(item: CxpItem): void {
    this.modalData = {
      tipo: 'pago', documentoId: item.facturaId,
      numeroDocumento: item.numeroFactura, contraparte: item.proveedorNombre,
      total: item.total, saldoPendiente: item.saldoPendiente,
    };
    this.modalVisible = true;
  }

  abrirHistorial(item: CxpItem): void {
    this.historialItem.set(item);
    this.historialPagos.set([]);
    this.historialVisible = true;
    this.historialLoading = true;
    this.svc.getHistorialPagos(item.facturaId).subscribe({
      next: pagos => { this.historialPagos.set(pagos.data); this.historialLoading = false; },
      error: () => this.historialLoading = false,
    });
  }

  onPagoExitoso(_result: any): void {
    this.modalVisible = false;
    this.modalData = null;
    this.cargar();
  }

  etiquetaEstado(status: PaymentStatus): string {
    const labels: Record<string, string> = { 
      pendiente: 'Pendiente', 
      parcial: 'Parcial', 
      pagado: 'Pagado', 
      vencido: 'Vencido' 
    };
    return labels[status] ?? status;
  }
}