const fs = require('fs');
const content = import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NominaService } from '../../services/nomina.service';
import { ObligacionNomina, EstadoObligacionNomina } from '../../interfaces/nomina.interface';
import { RegistrarPagoModalComponent } from '../components/registrar-pago-modal/registrar-pago-modal.component';

@Component({
  selector: 'app-tesoreria-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RegistrarPagoModalComponent],
  templateUrl: './tesoreria-page.component.html',
  styleUrls: ['./tesoreria-page.component.css']
})
export default class TesoreriaPageComponent implements OnInit {
  private nominaService = inject(NominaService);

  obligaciones: ObligacionNomina[] = [];
  obligacionesAgrupadas: { periodoId: string, periodoNombre: string, obligaciones: ObligacionNomina[] }[] = [];
  
  loading = false;
  error = '';

  // Selección
  selectedObligaciones: Set<string> = new Set();
  
  // Modal state
  showModal = false;
  selectedLote: ObligacionNomina[] = [];

  ngOnInit() {
    this.loadObligaciones();
  }

  loadObligaciones() {
    this.loading = true;
    this.error = '';
    
    // Solo cargamos las que no estén PAGADA
    this.nominaService.getObligaciones().subscribe({
      next: (res) => {
        this.obligaciones = res.filter(o => o.estado !== EstadoObligacionNomina.PAGADA);
        this.agruparObligaciones();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Error al cargar las obligaciones';
        this.loading = false;
        console.error(err);
      }
    });
  }

  agruparObligaciones() {
    const grupos = new Map<string, { periodoId: string, periodoNombre: string, obligaciones: ObligacionNomina[] }>();
    
    this.obligaciones.forEach(o => {
      const periodoNombre = o.periodo?.nombre || 'Período Desconocido';
      if (!grupos.has(o.periodoId)) {
        grupos.set(o.periodoId, { periodoId: o.periodoId, periodoNombre, obligaciones: [] });
      }
      grupos.get(o.periodoId).obligaciones.push(o);
    });

    this.obligacionesAgrupadas = Array.from(grupos.values());
  }

  toggleSelection(obligacionId: string) {
    if (this.selectedObligaciones.has(obligacionId)) {
      this.selectedObligaciones.delete(obligacionId);
    } else {
      this.selectedObligaciones.add(obligacionId);
    }
  }

  isAllSelected(periodoId: string): boolean {
    const grupo = this.obligacionesAgrupadas.find(g => g.periodoId === periodoId);
    if (!grupo || grupo.obligaciones.length === 0) return false;
    return grupo.obligaciones.every(o => this.selectedObligaciones.has(o.id));
  }

  toggleGroupSelection(periodoId: string, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const grupo = this.obligacionesAgrupadas.find(g => g.periodoId === periodoId);
    if (grupo) {
      grupo.obligaciones.forEach(o => {
        if (checked) {
          this.selectedObligaciones.add(o.id);
        } else {
          this.selectedObligaciones.delete(o.id);
        }
      });
    }
  }

  get totalSelectedAmount(): number {
    return this.obligaciones
      .filter(o => this.selectedObligaciones.has(o.id))
      .reduce((sum, o) => sum + Number(o.saldo), 0);
  }

  get hasSelection(): boolean {
    return this.selectedObligaciones.size > 0;
  }

  get periodosSeleccionados(): number {
    const periodos = new Set<string>();
    this.obligaciones.forEach(o => {
      if (this.selectedObligaciones.has(o.id)) {
        periodos.add(o.periodoId);
      }
    });
    return periodos.size;
  }

  prepararPago() {
    if (!this.hasSelection) return;
    
    // Solo permitimos pagar obligaciones de un mismo período a la vez
    if (this.periodosSeleccionados > 1) {
      alert('Por favor, selecciona obligaciones de un solo período para agrupar el comprobante de pago.');
      return;
    }

    this.selectedLote = this.obligaciones.filter(o => this.selectedObligaciones.has(o.id));
    this.showModal = true;
  }

  onPagoRegistrado() {
    this.showModal = false;
    this.selectedObligaciones.clear();
    this.loadObligaciones();
  }
};
fs.writeFileSync('src/app/admin-dashboard/pages/nomina/tesoreria/tesoreria-page/tesoreria-page.component.ts', content);
