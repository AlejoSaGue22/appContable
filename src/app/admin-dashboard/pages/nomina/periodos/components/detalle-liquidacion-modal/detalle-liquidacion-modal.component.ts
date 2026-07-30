import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  PeriodoNomina,
  Liquidacion,
  PagoNomina,
} from '../../../interfaces/nomina.interface';

@Component({
  selector: 'app-detalle-liquidacion-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './detalle-liquidacion-modal.component.html',
})
export class DetalleLiquidacionModalComponent {
  periodo = input.required<PeriodoNomina>();
  liquidaciones = input<Liquidacion[]>([]);
  pagos = input<PagoNomina[]>([]);
  close = output();
}
