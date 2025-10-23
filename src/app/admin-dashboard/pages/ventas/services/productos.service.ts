import { Injectable, signal, computed } from '@angular/core';
import { ProductosInterface } from '@dashboard/interfaces/productos-interface';

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  productosRegistrados = signal<ProductosInterface[]>([]);

  get _productos(): ProductosInterface[] {
    return this.productosRegistrados();
  }

  actualizarProductos(producto: Partial<ProductosInterface>){

    const productoUpdate = producto as any;

    const productosActualizados = this.productosRegistrados().map(p => {
      if(p.codigo === productoUpdate.codigo){
        return {
          ...
          p,
          ...productoUpdate
        }
      }
      return p;
    });

    this.productosRegistrados.set(productosActualizados);
  }

  agregarProducto(producto: Partial<ProductosInterface>){

    if (this.productosRegistrados().length === 0) {
      this.productosRegistrados.set([producto as ProductosInterface]);
      return;
    }

    this.productosRegistrados.update(productos => [
      ...productos,
      producto as ProductosInterface
    ]);
  }

}
