import { Component, EventEmitter, input, Output } from '@angular/core';
import { modalOpen } from '@shared/interfaces/services.interfaces';
import { RouterLink } from '@angular/router';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-table-productos-compra',
  imports: [RouterLink, TitleCasePipe, CurrencyPipe],
  templateUrl: './table-productos-compra.component.html',
})
export class TableProductosCompra {

  productoData = input<any[]>([]);
  @Output() delete = new EventEmitter<modalOpen>();

  onDeleteProducto(id: string) {
    this.delete.emit({ open: true, id });
  }
}
