import { CommonModule } from '@angular/common';
import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { of } from 'rxjs';

@Component({
  selector: 'app-proveedor-details',
  imports: [CommonModule, RouterLink],
  templateUrl: './proveedor-details.component.html',
  standalone: true
})
export class ProveedorDetailsComponent implements OnInit {
  proveedor = signal<any | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  constructor(
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadProveedor(id);
  }

  loadProveedor(id: string): void {
    this.loading.set(true);
    this.error.set(null);

    // TODO: Connect to real service
    // Simulating API call
    setTimeout(() => {
        this.proveedor.set({
            id: id,
            identificacion: '900123456',
            nombre: 'Proveedor Ejemplo SAS',
            telefono: '3001234567',
            email: 'contacto@proveedor.com',
            direccion: 'Calle 123 # 45-67',
            ciudad: 'Bogotá',
            estado: 'activo',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        this.loading.set(false);
    }, 1000);
  }

  print(): void {
    window.print();
  }
}
