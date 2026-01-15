import { CommonModule } from '@angular/common';
import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

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
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadCompra(id);
  }

  loadCompra(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    // TODO: Connect to real service
    setTimeout(() => {
        this.compra.set({
            id: id,
            fecha: new Date(),
            comprobante: 'FC-001',
            proveedor: 'Proveedor Ejemplo SAS',
            nit: '900.123.456',
            total: 1500000,
            subtotal: 1260504,
            iva: 239496,
            estado: 'pendiente',
            items: [
                { description: 'Laptop Gamer', quantity: 1, unitPrice: 1260504, total: 1260504 }
            ]
        });
        this.loading.set(false);
    }, 1000);
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
