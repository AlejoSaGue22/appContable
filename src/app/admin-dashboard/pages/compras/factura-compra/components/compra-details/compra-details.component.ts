import { CommonModule } from '@angular/common';
import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FacturaCompraService } from '@dashboard/pages/compras/services/factura-compra.service';

@Component({
  selector: 'app-compra-details',
  imports: [CommonModule, RouterLink],
  templateUrl: './compra-details.component.html',
  standalone: true
})
export class CompraDetailsComponent implements OnInit {
  compra = signal<any | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(
    private facturasService: FacturaCompraService,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadCompra(id);
  }

  loadCompra(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    this.facturasService.getFacturaCompraById(id).subscribe((response) => {
      this.loading.set(false)
      if (!response.success) {
        this.error.set('Error al cargar la factura');
        return;
      }

      this.compra.set(response.data.data[0]);
      console.log(this.compra());
      console.log(response.data);
    })

  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0
    }).format(value);
  }

  print(): void {
    window.print();
  }
}
