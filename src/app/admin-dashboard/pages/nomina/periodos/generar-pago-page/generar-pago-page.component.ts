import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NominaService } from '../../services/nomina.service';
import { PeriodoNomina, Liquidacion } from '../../interfaces/nomina.interface';
import { HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { LoaderService } from '@utils/services/loader.service';
import { NotificationService } from '@shared/services/notification.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-generar-pago-page',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    RouterLink,
    HeaderTitlePageComponent,
    FormsModule
  ],
  templateUrl: './generar-pago-page.component.html',
})
export default class GenerarPagoPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private nominaService = inject(NominaService);
  private loader = inject(LoaderService);
  private notification = inject(NotificationService);

  periodo = signal<PeriodoNomina | null>(null);
  liquidaciones = signal<(Liquidacion & { seleccionado?: boolean })[]>([]);
  bancos = signal<any[]>([]);
  
  isLoading = signal(true);
  
  // Formulario
  bancoSeleccionado = signal<string>('');
  cuentaOrigen = signal<string>('');
  searchQuery = signal<string>('');
  
  // Computed
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

  totalSeleccionados = computed(() => this.liquidaciones().filter(l => l.seleccionado).length);
  valorTotalSeleccionado = computed(() => {
    return this.liquidaciones()
      .filter(l => l.seleccionado)
      .reduce((acc, curr) => acc + curr.netoPagar, 0);
  });
  todosSeleccionados = computed(() => {
    const filter = this.filteredLiquidaciones();
    return filter.length > 0 && filter.every(l => l.seleccionado);
  });

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

    this.nominaService.getBancos().subscribe({
      next: (bancos) => {
        this.bancos.set(bancos);
      },
      error: () => {}
    });

    this.nominaService.getPeriodo(id).subscribe({
      next: (p) => {
        this.periodo.set(p);
        this.nominaService.getLiquidaciones(id).subscribe({
          next: (liqs) => {
            // Inicializar todos seleccionados por defecto
            this.liquidaciones.set(liqs.map(l => ({ ...l, seleccionado: true })));
            this.isLoading.set(false);
            this.loader.hide();
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

  toggleAll(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.liquidaciones.update(liqs => liqs.map(l => ({ ...l, seleccionado: checked })));
  }

  toggleRow(liquidacionId: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.liquidaciones.update(liqs => liqs.map(l => l.id === liquidacionId ? { ...l, seleccionado: checked } : l));
  }

  generarArchivo() {
    if (!this.bancoSeleccionado()) {
      this.notification.warning('Debe seleccionar un banco de origen');
      return;
    }
    if (!this.cuentaOrigen()) {
      this.notification.warning('Debe ingresar la cuenta de origen');
      return;
    }
    if (this.totalSeleccionados() === 0) {
      this.notification.warning('Debe seleccionar al menos un empleado');
      return;
    }

    const seleccionados = this.liquidaciones().filter(l => l.seleccionado);
    
    // Validar información bancaria de empleados
    const empleadosSinCuenta = seleccionados.filter(l => {
      const emp = l.empleado as any;
      return !emp.numeroCuenta || !emp.bancoId;
    });

    if (empleadosSinCuenta.length > 0) {
      this.notification.warning(`Hay ${empleadosSinCuenta.length} empleado(s) seleccionado(s) sin información bancaria completa.`);
      return;
    }

    this.loader.show();
    
    // Simulación de generación de archivo de texto plano para pago bancario
    setTimeout(() => {
      try {
        const banco = this.bancos().find(b => b.id === this.bancoSeleccionado()) || { nombre: this.bancoSeleccionado() };
        let contenido = `ENCABEZADO,${banco.nombre},${this.cuentaOrigen()},${this.periodo()?.nombre},${this.totalSeleccionados()},${this.valorTotalSeleccionado()}\n`;
        
        seleccionados.forEach(l => {
          const emp = l.empleado as any;
          const bancoEmp = this.bancos().find(b => b.id === emp.bancoId) || { nombre: emp.bancoId };
          contenido += `DETALLE,${emp.numeroDocumento},${emp.primerNombre} ${emp.primerApellido},${bancoEmp.nombre},${emp.tipoCuenta || 'Ahorros'},${emp.numeroCuenta},${l.netoPagar}\n`;
        });

        const blob = new Blob([contenido], { type: 'text/plain;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Archivo_Pago_${this.periodo()?.nombre?.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.notification.success('Archivo de pago generado exitosamente');
      } catch (err: any) {
        this.notification.error('Error al generar el archivo de pago', err?.message);
      } finally {
        this.loader.hide();
      }
    }, 1000);
  }

  volver() {
    this.router.navigate(['/panel/nomina/periodos', this.periodo()?.id, 'detalle']);
  }
}
