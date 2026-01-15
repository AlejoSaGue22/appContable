import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table-compras',
  imports: [CommonModule, RouterLink],
  templateUrl: './table-compras.component.html',
  standalone: true
})
export class TableComprasComponent {
  compraData = input<any[]>([]);
}
