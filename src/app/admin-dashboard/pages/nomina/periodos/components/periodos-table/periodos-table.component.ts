import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PeriodoNomina } from '../../../interfaces/nomina.interface';

@Component({
  selector: 'app-periodos-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './periodos-table.component.html',
})
export class PeriodosTableComponent {
  periodos = input<PeriodoNomina[]>([]);

  gestionarEmpleados = output<PeriodoNomina>();
  liquidar = output<PeriodoNomina>();
  prepararPago = output<PeriodoNomina>();
  verDetalle = output<PeriodoNomina>();
  anular = output<PeriodoNomina>();
  enviarDian = output<PeriodoNomina>();
  descargarXml = output<PeriodoNomina>();
}
