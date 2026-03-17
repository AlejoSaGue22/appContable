// cxc.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RegistrarPagoModalComponent, RegistrarPagoModalData } from '../components/modal-registrarpago/modal-registrarpago.component';
import { CxcItem, CxcResumen, PagoHistorial, PaymentStatus } from '@dashboard/interfaces/pagos-interface';
import { PagosHttpService } from '../services/pagos.service';
import { ModalComponent } from "@shared/components/modal/modal.component";
import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { ModalHistorialpagoComponent } from "../components/modal-historialpago/modal-historialpago..component";

@Component({
  selector: 'app-cxc',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RegistrarPagoModalComponent,
    ModalComponent,
    HeaderTitlePageComponent,
    ModalHistorialpagoComponent
],
  templateUrl: './cxc.component.html',
})
export class CxcComponent implements OnInit {
  headTitle = signal<HeaderInput>({ title: 'Cuentas por Cobrar', slog: 'Facturas de venta a crédito pendientes de pago' });

  // Estado
  private todosLosItems: CxcItem[] = [];
  resumen: CxcResumen = { totalCartera: 0, porVencer: 0, vencida: 0, cantidadPorVencer: 0, cantidadVencida: 0 };
  loading = false;

  // Filtros
  filtroTexto  = new FormControl('');
  filtroEstado = new FormControl<PaymentStatus | ''>('');

  // Items filtrados en el template (calculado al vuelo)
  get itemsFiltrados(): CxcItem[] {
    const texto  = (this.filtroTexto.value  ?? '').toLowerCase().trim();
    const estado = this.filtroEstado.value ?? '';

    return this.todosLosItems.filter(item => {
      const pasaTexto  = !texto  || item.clienteNombre.toLowerCase().includes(texto) || item.numeroFactura.toLowerCase().includes(texto);
      const pasaEstado = !estado || item.paymentStatus === estado;
      return pasaTexto && pasaEstado;
    });
  }

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
    this.loading = true;
    const estado = this.filtroEstado.value || undefined;

    this.svc.getCxc({ paymentStatus: estado as PaymentStatus }).subscribe({
      next: res => {
        this.todosLosItems = res.items;
        this.resumen       = res.resumen;
        this.loading       = false;
      },
      error: () => { this.loading = false; },
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
