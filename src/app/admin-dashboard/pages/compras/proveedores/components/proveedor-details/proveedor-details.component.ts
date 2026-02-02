import { CommonModule } from '@angular/common';
import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ProveedoresService } from '@dashboard/pages/compras/services/proveedores.service';
import { firstValueFrom } from 'rxjs';

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
    private route: ActivatedRoute,
    private proveedoresService: ProveedoresService
  ) { }

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    this.loadProveedor(id);
  }


  async loadProveedor(id: string) {
    this.loading.set(true);
    this.error.set(null);

    try {

      const proveedor = await firstValueFrom(this.proveedoresService.getProveedoresById(id));
      this.proveedor.set(proveedor);
      this.loading.set(false);

    } catch (error: any) {
      this.error.set(error.message);
      this.loading.set(false);
    }
  }

  print(): void {
    window.print();
  }
}
