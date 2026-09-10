import { Component, inject, signal, OnInit, HostListener, ElementRef, ViewChild, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NominaService } from '../../services/nomina.service';
import { PdfDesprendibleService } from '../../services/pdf-desprendible.service';
import { PeriodoNomina, Liquidacion, PagoNomina } from '../../interfaces/nomina.interface';
import { HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { LoaderService } from '@utils/services/loader.service';
import { NotificationService } from '@shared/services/notification.service';
import { ConfirmModalComponent, ConfirmModalConfig } from '@shared/components/confirm-modal/confirm-modal.component';
import { EmpresaService } from '@dashboard/services/empresa.service';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

@Component({
  selector: 'app-periodo-detalle-page',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    RouterLink,
    HeaderTitlePageComponent,
    ConfirmModalComponent,
    FormsModule
  ],
  templateUrl: './periodo-detalle-page.component.html',
})
export default class PeriodoDetallePageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private nominaService = inject(NominaService);
  private pdfService = inject(PdfDesprendibleService);
  private empresaService = inject(EmpresaService);
  private loader = inject(LoaderService);
  private notification = inject(NotificationService);

  periodo = signal<PeriodoNomina | null>(null);
  liquidaciones = signal<Liquidacion[]>([]);
  pagos = signal<PagoNomina[]>([]);
  empresa = signal<any>(null);
  isLoading = signal(true);
  isDropdownOpen = signal(false);
  searchQuery = signal<string>('');

  filteredLiquidaciones = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return this.liquidaciones();

    return this.liquidaciones().filter(l => {
      const emp = l.empleado as any;
      const nombreCompleto = `${emp.primerNombre} ${emp.segundoNombre || ''} ${emp.primerApellido} ${emp.segundoApellido || ''}`.toLowerCase();
      const doc = (emp.numeroDocumento || '').toLowerCase();
      return nombreCompleto.includes(query) || doc.includes(query);
    });
  });

  uniqueComprobantes = computed(() => {
    const map = new Map<string, any>();
    this.liquidaciones().forEach(l => {
      if (l.comprobante) {
        const c = { ...l.comprobante };
        c.empleadoNombre = `${l.empleado?.primerNombre || ''} ${l.empleado?.segundoNombre || ''} ${l.empleado?.primerApellido || ''} ${l.empleado?.segundoApellido || ''}`.replace(/\s+/g, ' ').trim();
        c.empleadoDocumento = l.empleado?.numeroDocumento || '';
        c.netoPagar = l.netoPagar;
        map.set(c.id, c);
      }
    });
    return Array.from(map.values());
  });

  isComprobantesModalOpen = signal(false);

  openComprobantesModal() {
    this.isComprobantesModalOpen.set(true);
  }

  closeComprobantesModal() {
    this.isComprobantesModalOpen.set(false);
  }

  confirmModal = signal<ConfirmModalConfig | null>(null);
  private confirmCallback: (() => void) | null = null;

  @ViewChild('dropdownContainer') dropdownContainer!: ElementRef;

  @HostListener('document:click', ['$event'])
  onClick(event: Event) {
    if (this.isDropdownOpen() && this.dropdownContainer && !this.dropdownContainer.nativeElement.contains(event.target)) {
      this.isDropdownOpen.set(false);
    }
  }

  toggleDropdown(event: Event) {
    event.stopPropagation();
    this.isDropdownOpen.update(val => !val);
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notification.error('Identificador del período no especificado');
      this.router.navigate(['/panel/nomina/periodos']);
      return;
    }
    this.loadData(id);
  }

  private loadData(id: string) {
    this.isLoading.set(true);
    this.loader.show();

    this.empresaService.getEmpresa().subscribe({
      next: (res: any) => {
        this.empresa.set(res?.data || res);
      },
      error: () => { },
    });

    this.nominaService.getPeriodo(id).subscribe({
      next: (p) => {
        this.periodo.set(p);
        this.nominaService.getLiquidaciones(id).subscribe({
          next: (liqs) => {
            this.liquidaciones.set(liqs);
            this.nominaService.getPagosByPeriodo(id).subscribe({
              next: (pagos) => {
                this.pagos.set(pagos);
                this.isLoading.set(false);
                this.loader.hide();
              },
              error: () => { this.isLoading.set(false); this.loader.hide(); },
            });
          },
          error: () => { this.isLoading.set(false); this.loader.hide(); },
        });
      },
      error: (err) => {
        this.notification.error('Error al cargar el período', err);
        this.isLoading.set(false);
        this.loader.hide();
      },
    });
  }

  verDetalleEmpleado(liquidacion: Liquidacion) {
    const periodoId = this.route.snapshot.paramMap.get('id');
    this.router.navigate(['/panel/nomina/periodos', periodoId, 'empleado', liquidacion.empleadoId]);
  }

  private pedirConfirmacion(config: ConfirmModalConfig, onConfirm: () => void) {
    this.confirmModal.set(config);
    this.confirmCallback = onConfirm;
  }

  onConfirmado() {
    this.confirmCallback?.();
    this.confirmModal.set(null);
    this.confirmCallback = null;
  }

  onCancelado() {
    this.confirmModal.set(null);
    this.confirmCallback = null;
  }

  liquidarPeriodo() {
    const periodo = this.periodo();
    if (!periodo) return;
    this.pedirConfirmacion(
      {
        title: 'Liquidar Nómina',
        message: `¿Desea liquidar la nómina del período "${periodo.nombre}"?`,
        detail: 'Esta acción procesará los conceptos recurrentes y deducciones legales.',
        icon: 'warning',
        confirmLabel: 'Sí, Liquidar',
        confirmClass: 'bg-green-600 hover:bg-green-700',
      },
      () => {
        this.loader.show();
        this.nominaService.liquidarPeriodo(periodo.id, { empleados: [] }).subscribe({
          next: () => {
            this.notification.success('Nómina liquidada exitosamente');
            this.loadData(periodo.id);
            this.loader.hide();
          },
          error: (err) => {
            this.notification.error('Error al liquidar nómina', err);
            this.loader.hide();
          },
        });
      }
    );
  }

  descargarDetalleExcel() {
    this.isDropdownOpen.set(false);
    const periodo = this.periodo();
    const liqs = this.liquidaciones();
    if (!periodo || liqs.length === 0) {
      this.notification.warning('No hay liquidaciones para exportar');
      return;
    }

    this.loader.show();
    try {
      const data = liqs.map(l => {
        const emp = l.empleado as any;
        return {
          'Documento': emp?.numeroDocumento || '',
          'Nombre': `${emp?.primerNombre || ''} ${emp?.segundoNombre || ''} ${emp?.primerApellido || ''} ${emp?.segundoApellido || ''}`.trim(),
          'Cargo': emp?.cargo?.nombre || '',
          'Días Trabajados': l.diasTrabajados,
          'Salario Básico': l.salarioDevengado,
          'Auxilio Transporte': l.auxilioTransporte,
          'Comisiones': l.comisiones,
          'Bonificaciones': l.totalBonificaciones,
          'Horas Extras': l.totalHorasExtras,
          'Total Devengado': l.totalDevengado,
          'Base IBC': l.ibc,
          'Salud': l.saludEmpleado,
          'Pensión': l.pensionEmpleado,
          'Retefuente': l.retencionFuente,
          'Total Deducciones': l.totalDeducciones,
          'Neto a Pagar': l.netoPagar
        };
      });

      const ws: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
      const wb: XLSX.WorkBook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Liquidaciones');

      const fileName = `Detalle_Liquidacion_${periodo.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`;
      XLSX.writeFile(wb, fileName);
      this.notification.success('Archivo Excel descargado exitosamente');
    } catch (err: any) {
      this.notification.error('Error al generar Excel', err?.message);
    } finally {
      this.loader.hide();
    }
  }

  async descargarComprobantesZip() {
    this.isDropdownOpen.set(false);
    const periodo = this.periodo();
    const liqs = this.liquidaciones();
    if (!periodo || liqs.length === 0) {
      this.notification.warning('No hay liquidaciones para generar comprobantes');
      return;
    }

    this.loader.show();
    try {
      const zip = new JSZip();
      const folder = zip.folder(`Comprobantes_${periodo.nombre.replace(/[^a-zA-Z0-9]/g, '_')}`);

      let count = 0;
      for (const liq of liqs) {
        try {
          const result = this.pdfService.generarDesprendible(liq, periodo, this.empresa(), true) as { blob: Blob, fileName: string };
          if (result && result.blob) {
            folder!.file(result.fileName, result.blob);
            count++;
          }
        } catch (err) {
          console.error(`Error generando desprendible para ${liq.empleadoId}`, err);
        }
      }

      if (count > 0) {
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = window.URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Comprobantes_${periodo.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.notification.success(`${count} comprobantes empaquetados exitosamente`);
      } else {
        this.notification.warning('No se pudo generar ningún comprobante');
      }
    } catch (err: any) {
      this.notification.error('Error al generar ZIP', err?.message);
    } finally {
      this.loader.hide();
    }
  }

  irAGenerarPago() {
    this.isDropdownOpen.set(false);
    const periodoId = this.periodo()?.id;
    if (periodoId) {
      this.router.navigate(['/panel/nomina/periodos', periodoId, 'generar-pago']);
    }
  }

  volver() {
    this.router.navigate(['/panel/nomina/periodos']);
  }
}

