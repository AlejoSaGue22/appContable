import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Factura, ProductoFactura } from './../../../../interfaces/documento-venta-interface';
import { AfterContentInit, Component, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { ListGroupDropdownComponent } from "@shared/components/list-group-dropdown/list-group-dropdown.component";
import { forkJoin, tap } from 'rxjs';
import { FormErrorLabelComponent } from "src/app/utils/components/form-error-label/form-error-label.component";
import { ClientesService } from '../../services/clientes.service';
import { ProductosService } from '../../services/productos.service';
import { GetProductosDetalle, ProductosInterface } from '@dashboard/interfaces/productos-interface';
import { ClientesInterface } from '@dashboard/interfaces/clientes-interface';

@Component({
  selector: 'app-comprobante-ventas-forms-page',
  imports: [HeaderTitlePageComponent, ReactiveFormsModule, ListGroupDropdownComponent, CurrencyPipe,
            DecimalPipe, FormErrorLabelComponent],
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
        importe: 0
    }


    // private fb = inject(FormBuilder);
    // clienteServicios = inject(ClientesService);
    // productoServicios = inject(ProductosService);
    // factura = signal<Factura | null>(null);
    // productSeleccionados = signal<ProductoFactura[]>([]);
    // getAllProductos = signal<ProductosInterface[]>([]);
    // getAllClientes = signal<ClientesInterface[]>([]);

    // onProductFrom = effect((onCleanup) => {
    //     const valorTotal = this.onValorTotal();

    //     onCleanup(() => {
    //       valorTotal?.unsubscribe();
    //     })
    // });

    // ngOnInit(): void {
    //       forkJoin({
    //         clientes: this.clienteServicios.getClientes({ limit: 10000, offset: 0}),
    //         productos: this.productoServicios.getProductos({ limit: 10000, offset: 0})
    //       }).subscribe({
    //         next: ({clientes, productos}) => {
    //             const clienteMap = clientes.clientes.map((item) => {
    //                 return {
    //                     nombre: item.nombre + item.apellido
    //                 }
    //             })
    //             this.getAllClientes.set(clientes.clientes);
    //             this.getAllProductos.set(productos.productos);
    //         },
    //         error: (error) => {
    //             console.log("Error Comprobantes Ventas: ", error)
    //         }
    //       });
    // }


   formVentas = this.fb.group({
      cliente: ['', Validators.required],
      identificacion: ['', Validators.required],
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
        descripcion: [''],
        cantidad: [0, [Validators.required, Validators.min(1)]],
        valorUnitario: [0, [Validators.required, Validators.min(0)]],
        descuento: [0, [Validators.min(0), Validators.maxLength(3)]],
        impuestos: ['', [Validators.min(0)]],
    })

    get productosArray () {
        return this.productSeleccionados();
    }

    onValorTotal(){
      console.log("Cantidad 2", this.productosItemsForm.controls.cantidad.value)
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
      const valorItemImporte = this.calcularDescuentoImporte();
      const impuesto = this.productosItemsForm.value.impuestos ?? '0';
      const nuevoItemConId = {
        ...valores,
        id: crypto.randomUUID(),
        subtotal: this.productosItemsForm.value.cantidad! * this.productosItemsForm.value.valorUnitario!,
        impuesto: impuesto,
        importe: valorItemImporte,
        iva_valor: ((this.productosItemsForm.value.cantidad! * this.productosItemsForm.value.valorUnitario!) *
                                                                                 (parseInt(impuesto) / 100)),
        descuento_valor: ((this.productosItemsForm.value.cantidad! * this.productosItemsForm.value.valorUnitario!) * 
                                                                                  (valores.descuento / 100)),
        valorTotal: valorItemTotal
      }
      
      this.productSeleccionados().push(nuevoItemConId);
      this.calcularTotal();
      this.reiniciarProducto();

    }

    calcularItemTotal(): number {
        const impuesto = this.productosItemsForm.value.impuestos ?? '0';

        const valorNeto = this.productosItemsForm.value.cantidad! * this.productosItemsForm.value.valorUnitario!;
        const descuentoAplicado = valorNeto * (this.productosItemsForm.value.descuento! / 100);
        const valorDescontado = valorNeto - descuentoAplicado;
        const impuestoAplicado = valorDescontado * (parseInt(impuesto) / 100);
        
        return valorDescontado + impuestoAplicado;
    }

    calcularDescuentoImporte(): number {

        const valorNeto = this.productosItemsForm.value.cantidad! * this.productosItemsForm.value.valorUnitario!;
        const descuentoAplicado = valorNeto * (this.productosItemsForm.value.descuento! / 100);
        const valorDescontado = valorNeto - descuentoAplicado;
        
        return valorDescontado;
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

    onClienteSeleccionado(cliente: Partial<ClientesInterface>){
        this.formVentas.patchValue({
          contacto: cliente.email,
          identificacion: cliente.numeroDocumento
        })
    }

    onProductoSeleccionado(producto: Partial<GetProductosDetalle>){
        this.productosItemsForm.patchValue({
            valorUnitario: parseInt(producto.precioventa1 ?? '0'),
            impuestos: producto.iva_percent,
        })
    }

    calcularTotal(){
        this.totales.facturaTotal = this.productSeleccionados().reduce((accumulator, currentValue) =>  accumulator + currentValue.valorTotal, 0);
        this.totales.subtotal = this.productSeleccionados().reduce((accu, current) => accu + current.subtotal, 0);
        this.totales.retenciones =  0;
        this.totales.totalIVA = this.productSeleccionados().reduce((accu, current) => accu + current.iva_valor, 0);
        this.totales.descuentoTotal = this.productSeleccionados().reduce((accu, current) => accu + current.descuento_valor, 0);
    }

    async onSubmit(){
        const valueFormFactura =  this.formVentas.value;
        const valueFormProductos = this.productosItemsForm.value;

        console.log("valueFormFactura: ",valueFormFactura);
        console.log("valueFormProductos: ",valueFormProductos);
    }
 }
