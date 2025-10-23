import { CurrencyPipe } from '@angular/common';
import { Factura, ProductoFactura } from './../../../../interfaces/documento-venta-interface';
import { Component, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { ListGroupDropdownComponent } from "@shared/components/list-group-dropdown/list-group-dropdown.component";
import { forkJoin, tap } from 'rxjs';
import { ProductosService } from '../../services/productos.service';
import { ClientesService } from '../../services/clientes.service';
import { ClientesInterface } from '../../../../interfaces/clientes-interface';
import { ProductosInterface } from '@dashboard/interfaces/productos-interface';
import { FormErrorLabelComponent } from '@utils/components/form-error-label/form-error-label.component';

@Component({
  selector: 'app-comprobante-ventas-forms-page',
  imports: [HeaderTitlePageComponent, ReactiveFormsModule, ListGroupDropdownComponent, CurrencyPipe, FormErrorLabelComponent],
  templateUrl: './comprobante-ventas-forms-page.component.html',
})
export class ComprobanteVentasFormsPageComponent implements OnInit {

    headTitle: HeaderInput = {
        title: 'Crear documento de venta',
        slog: 'Se registra nueva factura de venta al sistema'
    }

    private productosService = inject(ProductosService);
    private clienteService = inject(ClientesService);
    factura = signal<Factura | null>(null);
    productSeleccionados = signal<ProductoFactura[]>([]);

    productos = signal<ProductosInterface[]>([]);
    clientes = signal<ClientesInterface[]>([]);
    private fb = inject(FormBuilder);

    ngOnInit(): void {

        const productos$ = this.productosService._productos;
        const clientes$ = this.clienteService._clientes;

        this.productos.set(productos$);
        this.clientes.set(clientes$);
            console.log("Productos: ", this.productosService._productos);
            console.log("Clientes: ", this.clienteService._clientes); 
    }

    onProductFrom = effect((onCleanup) => {
        const valorTotal = this.onValorTotal();

        onCleanup(() => {
          valorTotal?.unsubscribe();
        })
    })

    totales = {
      subtotal: 0,
      totalIVA: 0,
      descuentoTotal: 0,
      impuestos: 0,
      retenciones: 0,
      facturaTotal: 0,
    }

    formVentas = this.fb.group({
      cliente: ['', Validators.required],
      numero: ['', Validators.required],
      contacto: [''],
      vendedor: [''],
      formaPago: ['', Validators.required],
      fecha: ['', Validators.required],
      canal: [''],
      productos: [[], Validators.required]
    })

    productosItemsForm = this.fb.group({
        producto: ['', Validators.required],
        descripcion: ['', Validators.required],
        cantidad: [0, [Validators.required, Validators.min(1)]],
        valorUnitario: [0, [Validators.required, Validators.min(0)]],
        descuento: [0, [Validators.min(0), Validators.max(100)]],
        impuestos: ['', [Validators.min(0)]],
    })

    get productosArray () {
        return this.productSeleccionados();
    }

    onValorTotal(){
      console.log("Cantidad", this.productosItemsForm.controls.cantidad.value)
      console.log("Valor unitario", this.productosItemsForm.controls.valorUnitario.value)
      // if(!this.productosItemsForm.controls.cantidad.value || !this.productosItemsForm.controls.valorUnitario.value) return

      return this.productosItemsForm.valueChanges.pipe(
        tap((valor) => console.log("Valor: ", valor)),
        tap((valor) => console.log("Cantidad", this.productosItemsForm.controls.cantidad.value)),
      )
      .subscribe((valor) => {
        const cantidad = this.productosItemsForm.get('cantidad')?.value;
        const unitario = this.productosItemsForm.get('valorUnitario')?.value;
          
        if (cantidad && unitario) {
          
        }
      })
    }

    async setProductos(){
      if(!this.productosItemsForm.valid) return;

      const valores = this.productosItemsForm.value as ProductoFactura;
      const valorItemTotal = this.calcularItemTotal();
      const impuesto = this.productosItemsForm.value.impuestos?.split("-")[1] ?? '0';
      const nuevoItemConId = {
        ...valores,
        id: crypto.randomUUID(),
        subtotal: this.productosItemsForm.value.cantidad! * this.productosItemsForm.value.valorUnitario!,
        impuestos: (((this.productosItemsForm.value.cantidad! * this.productosItemsForm.value.valorUnitario!) * 
                   (1 - this.productosItemsForm.value.descuento! / 100)) * (parseInt(impuesto) / 100)).toString(),
        //valorBruto: (this.nuevoItemForm.value.  * this.nuevoItemForm.value.valorUnitario) * (1 - this.nuevoItemForm.value.descuento / 100),
        valorTotal: valorItemTotal
      }
      
      this.productSeleccionados().push(nuevoItemConId);
      this.calcularTotal();
      this.reiniciarProducto();

      console.log("Array: ", this.productSeleccionados());
    }

    calcularItemTotal(): number {
        const impuesto = this.productosItemsForm.value.impuestos?.split("-")[1] ?? '0';

        const valorNeto = this.productosItemsForm.value.cantidad! * this.productosItemsForm.value.valorUnitario!;
        const descuentoAplicado = valorNeto * (this.productosItemsForm.value.descuento! / 100);
        const valorDescontado = valorNeto - descuentoAplicado;
        const impuestoAplicado = valorDescontado * (parseInt(impuesto) / 100);
        
        return valorDescontado + impuestoAplicado;
    }

    deleteProducto(id: string){
        let index = this.productSeleccionados().findIndex(value => value.id == id)
        
        if (index != -1) {
            this.productSeleccionados().splice(index, 1);
            this.calcularTotal();
        }
    }

    reiniciarProducto(){
        this.productosItemsForm.reset({
            producto: '',
            descripcion: '',
            cantidad: 0,
            valorUnitario: 0,
            descuento: 0,
            impuestos: '0',
        })
    }

    calcularTotal(){
        this.totales.facturaTotal = this.productSeleccionados().reduce((accumulator, currentValue) =>  accumulator + currentValue.valorTotal, 0);
        this.totales.impuestos = this.productSeleccionados().reduce((accu, current) => accu + parseInt(current.impuestos), 0);
        this.totales.subtotal = this.productSeleccionados().reduce((accu, current) => accu + current.subtotal, 0);
        this.totales.retenciones =  0;
        this.totales.descuentoTotal = this.productSeleccionados().reduce((accu, current) => accu + current.descuento, 0);
    }

    async onSubmit(){
        const valueFormFactura =  this.formVentas.value;
        const valueFormProductos = this.productosItemsForm.value;

        console.log("valueFormFactura: ",valueFormFactura);
        console.log("valueFormProductos: ",valueFormProductos);
        
    }
 }
