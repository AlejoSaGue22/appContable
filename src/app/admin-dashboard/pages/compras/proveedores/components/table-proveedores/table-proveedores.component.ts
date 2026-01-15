import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table-proveedores',
  imports: [CommonModule, RouterLink],
  templateUrl: './table-proveedores.component.html',
  standalone: true
})
export class TableProveedoresComponent {
  proveedorData = input<any[]>([]);
}
