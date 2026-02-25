import { Component, input, Output, EventEmitter } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { GetProductosDetalle } from '@dashboard/interfaces/productos-interface';
import { modalOpen } from '@shared/interfaces/services.interfaces';

@Component({
  selector: 'app-table-productos',
  imports: [CommonModule, RouterLink],
  templateUrl: './table-productos.component.html',
  standalone: true
})
export class TableProductosComponent {

  productosData = input<GetProductosDetalle[]>([]);
  @Output() delete = new EventEmitter<modalOpen>();

  onDeleteProducto(id: string) {
    this.delete.emit({ open: true, id });
  }
}
