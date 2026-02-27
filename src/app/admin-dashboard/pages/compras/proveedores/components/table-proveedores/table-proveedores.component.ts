import { Component, input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ProveedoresRequest } from '@dashboard/interfaces/proveedores-interface';
import { modalOpen } from '@shared/interfaces/services.interfaces';

@Component({
  selector: 'app-table-proveedores',
  imports: [CommonModule, RouterLink],
  templateUrl: './table-proveedores.component.html',
  standalone: true
})
export class TableProveedoresComponent {

  proveedorData = input<ProveedoresRequest[]>([]);
  @Output() delete = new EventEmitter<modalOpen>();

  onDeleteProveedor(id: string) {
    this.delete.emit({ open: true, id });
  }
}
