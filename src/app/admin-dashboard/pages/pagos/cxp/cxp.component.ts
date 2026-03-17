// cxp.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RegistrarPagoModalComponent, RegistrarPagoModalData } from '../components/modal-registrarpago/modal-registrarpago.component';
import { CxpItem, CxpResumen, PagoHistorial, PaymentStatus } from '@dashboard/interfaces/pagos-interface';
import { PagosHttpService } from '../services/pagos.service';
import { ModalComponent } from "@shared/components/modal/modal.component";
import { HeaderTitlePageComponent, HeaderInput } from "@dashboard/components/header-title-page/header-title-page.component";
import { ModalHistorialpagoComponent } from "../components/modal-historialpago/modal-historialpago..component";

@Component({
  selector: 'app-cxp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RegistrarPagoModalComponent, ModalComponent, HeaderTitlePageComponent, ModalHistorialpagoComponent],
  templateUrl: './cxp.component.html',
})
export class CxpComponent implements OnInit {
  headTitle = signal<HeaderInput> ({
    title: 'Cuentas por Pagar',
    slog: 'Facturas de compra a crédito pendientes de pago'
  });

  private todosLosItems: CxpItem[] = [];
  resumen: CxpResumen = { totalPorPagar: 0, porVencer: 0, vencida: 0, cantidadPorVencer: 0, cantidadVencida: 0 };
  loading = false;

  filtroTexto  = new FormControl('');
  filtroEstado = new FormControl<PaymentStatus | ''>('');

  get itemsFiltrados(): CxpItem[] {
    const texto  = (this.filtroTexto.value  ?? '').toLowerCase().trim();
    const estado = this.filtroEstado.value ?? '';
    
    return this.todosLosItems.filter(item => {
      const pasaTexto  = !texto  || item.proveedorNombre.toLowerCase().includes(texto) || item.numeroFactura.toLowerCase().includes(texto);
      const pasaEstado = !estado || item.paymentStatus === estado;
      return pasaTexto && pasaEstado;
    });
  }

  modalVisible = false;
  modalData: RegistrarPagoModalData | null = null;

  // Modal historial
  historialVisible  = false;
  historialLoading  = false;
  historialItem: CxpItem | null = null;
  historialPagos: PagoHistorial[] = [];

  constructor(private svc: PagosHttpService) {}

  ngOnInit(): void {
    this.cargar();
    this.filtroEstado.valueChanges.subscribe(() => {});
    this.filtroTexto.valueChanges.pipe(debounceTime(250), distinctUntilChanged()).subscribe(() => {});
  }

  cargar(): void {
    this.loading = true;
    const estado = this.filtroEstado.value || undefined;
    this.svc.getCxp({ paymentStatus: estado as PaymentStatus }).subscribe({
      next: res => { this.todosLosItems = res.items; this.resumen = res.resumen; this.loading = false; },
      error: () => { this.loading = false; },
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
    this.historialItem    = item;
    this.historialPagos   = [];
    this.historialVisible = true;
    this.historialLoading = true;
    this.svc.getHistorialPagos(item.facturaId).subscribe({
      next: pagos => { this.historialPagos = pagos; this.historialLoading = false; },
      error: ()   => { this.historialLoading = false; },
    });
  }

  onPagoExitoso(_result: any): void {
    this.modalVisible = false;
    this.modalData = null;
    this.cargar();
  }

  etiquetaEstado(status: PaymentStatus): string {
    return ({ pendiente: 'Pendiente', parcial: 'Parcial', pagado: 'Pagado', vencido: 'Vencido' })[status] ?? status;
  }
}