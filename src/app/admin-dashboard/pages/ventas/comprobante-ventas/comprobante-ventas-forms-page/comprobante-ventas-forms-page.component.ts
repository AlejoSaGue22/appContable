import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FacturaVenta, ItemFactura } from './../../../../interfaces/documento-venta-interface';
import { AfterContentInit, Component, effect, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { ListGroupDropdownComponent } from "@shared/components/list-group-dropdown/list-group-dropdown.component";
import { forkJoin, map, tap } from 'rxjs';
import { FormErrorLabelComponent } from "src/app/utils/components/form-error-label/form-error-label.component";
import { ClientesService } from '../../services/clientes.service';
import { ProductosService } from '../../services/productos.service';
import { GetProductosDetalle, ProductosInterface } from '@dashboard/interfaces/productos-interface';
import { ClientesInterface } from '@dashboard/interfaces/clientes-interface';
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { NotificationService } from '@shared/services/notification.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { ComprobantesVentasService } from '../../services/comprobantes-ventas.service';

@Component({
  selector: 'app-comprobante-ventas-forms-page',
  imports: [HeaderTitlePageComponent, ReactiveFormsModule, ListGroupDropdownComponent, CurrencyPipe,
    DecimalPipe, FormErrorLabelComponent, RouterLink],
  templateUrl: './comprobante-ventas-forms-page.component.html',
})
export class ComprobanteVentasFormsPageComponent implements OnInit {

    headTitle: HeaderInput = {
        title: 'Crear documento de venta',
        slog: 'Se registra nueva factura de venta al sistema'
    }

    totales = {
          subtotal: 0,
          totalIVA: 0,
          descuentoTotal: 0,
          impuestos: 0,
          retenciones: 0,
          facturaTotal: 0,
          importe: 0
    }

    private fb = inject(FormBuilder);
    clienteServicios = inject(ClientesService);
    productoServicios = inject(ProductosService);
    ventaServices = inject(ComprobantesVentasService);
    factura = signal<FacturaVenta | null>(null);
    notificacionService = inject(NotificationService);
    productSeleccionados = signal<ItemFactura[]>([]);
    getAllProductos = signal<ProductosInterface[]>([]);
    getAllClientes = signal<ClientesInterface[]>([]);
    activateRoute = inject(ActivatedRoute);
    router = inject(Router);
    loading = signal<boolean>(false);

    invoiceID = toSignal(
      this.activateRoute.params.pipe(
        map((param) => param['id'])
      )
    );

    ngOnInit(): void {
          forkJoin({
            clientes: this.clienteServicios.getClientes({ limit: 10000, offset: 0}),
            productos: this.productoServicios.getProductos({ limit: 10000, offset: 0})
          }).subscribe({
            next: ({clientes, productos}) => {
                const clienteMap = clientes.clientes.map((item) => {
                    return {
                        nombre: item.nombre + item.apellido
                    }
                })
                this.getAllClientes.set(clientes.clientes);
                this.getAllProductos.set(productos.productos);
            },
            error: (error) => {
                console.log("Error Comprobantes Ventas: ", error)
            }
          });
    }


   formVentas = this.fb.group({
      cliente: ['', Validators.required],
      clienteSearch: [''],
      tipoDocumento: ['', Validators.required],
      identificacion: ['', Validators.required],
      contacto: [''],
      vendedor: [''],
      formaPago: ['', Validators.required],
      fecha: ['', Validators.required],
      canal: [''],
      productos: [[]]
    })

    productosItemsForm = this.fb.group({
        producto: ['', Validators.required],
        productoId: ['', Validators.required],
        description: [''],
        quantity: [0, [Validators.required, Validators.min(1)]],
        unitPrice: [0, [Validators.required, Validators.min(0)]],
        iva: [0, [Validators.min(0), Validators.max(100)]],
        iva_valor: [0],
        
        // 🔧 NUEVO: Campos para descuento
        discount: [0, [Validators.min(0), Validators.max(100)]], // % de descuento
        descuento_valor: [0], // Valor calculado del descuento
        
        subtotal: [0],
        importe: [0], // Para compatibilidad con backend
        total: [0]
    })

    get productosArray () {
        return this.productSeleccionados();
    }

    async setProductos(){
      if(!this.productosItemsForm.valid) return;

      const valores = this.productosItemsForm.value as ItemFactura;
      const valorItemTotal = this.calcularItemTotal();
      const valorItemImporte = this.calcularDescuentoImporte();
      const impuestoIva = this.productosItemsForm.value.iva ?? 0;
      const nuevoItemConId = {
        ...valores,
        id: crypto.randomUUID(),
        subtotal: this.productosItemsForm.value.quantity! * this.productosItemsForm.value.unitPrice!,
        importe: valorItemImporte,
        iva: impuestoIva,
        valor_iva: ((this.productosItemsForm.value.quantity! * this.productosItemsForm.value.unitPrice!) *
                                                                                 (impuestoIva / 100)),
        discount: valores.discount,                                                                          
        valor_discount: ((this.productosItemsForm.value.quantity! * this.productosItemsForm.value.unitPrice!) * 
                                                                                  (valores.discount! / 100)),
        total: valorItemTotal
      }
      
      this.productSeleccionados().push(nuevoItemConId);
      this.calcularTotal();
      this.reiniciarProducto();

    }

    calcularItemTotal(): number {
        const impuesto = this.productosItemsForm.value.iva ?? 0;

        const valorNeto = this.productosItemsForm.value.quantity! * this.productosItemsForm.value.unitPrice!;
        const descuentoAplicado = valorNeto * (this.productosItemsForm.value.discount! / 100);
        const valorDescontado = valorNeto - descuentoAplicado;
        const impuestoAplicado = valorDescontado * (impuesto / 100);
        
        return valorDescontado + impuestoAplicado;
    }

    calcularDescuentoImporte(): number {

        const valorNeto = this.productosItemsForm.value.quantity! * this.productosItemsForm.value.unitPrice!;
        const descuentoAplicado = valorNeto * (this.productosItemsForm.value.discount! / 100);
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
                description: '',
                quantity: 0,
                unitPrice: 0,
                discount: 0,
                iva: 0,
          })
    }

    onClienteSeleccionado(cliente: Partial<ClientesInterface>){
        this.formVentas.patchValue({
          cliente: cliente.id,
          clienteSearch: cliente.nombre,
          tipoDocumento: cliente.tipoDocumento,
          contacto: cliente.email,
          identificacion: cliente.numeroDocumento
        })
    }

    onProductoSeleccionado(producto: Partial<GetProductosDetalle>){
      console.log("Producto seleccionado: ", producto);
        this.productosItemsForm.patchValue({
            unitPrice: parseInt(producto.precioventa1 ?? '0'),
            iva: parseInt(producto.iva_percent ?? '0'),
            productoId: producto.id
        })
    }

    calcularTotal(){

        this.totales.facturaTotal = this.productSeleccionados().reduce((accumulator, currentValue) =>  accumulator + currentValue.total!, 0);
        this.totales.subtotal = this.productSeleccionados().reduce((accu, current) => accu + current.subtotal!, 0);
        this.totales.retenciones =  0;
        this.totales.totalIVA = this.productSeleccionados().reduce((accu, current) => accu + current.valor_iva!, 0);
        this.totales.descuentoTotal = this.productSeleccionados().reduce((accu, current) => accu + current.valor_discount!, 0);

        console.log(this.totales);
    }

    async onSubmit(){
      
      const validFactura = this.formVentas.valid;
      const validProduct = this.productosItemsForm.valid;
      this.formVentas.markAllAsTouched();
      // this.productosItemsForm.markAllAsTouched();

      if(!validFactura) {
        this.notificacionService.error(
              'Por favor, completa los campos requeridos.',
              'Campos no validos',
              5000
          );
        return;
      }

      if (this.productSeleccionados().length == 0) {
          this.notificacionService.error(
              'Debes agregar productos a la factura',
              'Error',
              5000
          );
        return;
      }

      this.loading.set(true)
      const valueFormFactura = this.formVentas.value ;
      const productos = this.productSeleccionados();
      console.log("Formulario Value: ", valueFormFactura);
      console.log("Productos seleccionado: ", productos);

      const invoiceData: Partial<FacturaVenta> = {
          clientId: valueFormFactura.cliente!,
          vendedor: valueFormFactura.vendedor!,
          canalventa: valueFormFactura.canal!,
          fecha: valueFormFactura.fecha!,
          formapago: valueFormFactura.formaPago!,
          items: productos.map((item) => ({
              productoId: item.productoId,
              description: item.description,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              iva: item.iva,
              discount: item.discount,
              importe: item.importe,
          })),
          subtotal: this.totales.subtotal,
          iva: this.totales.totalIVA,
          descuento: this.totales.descuentoTotal,
          total: this.totales.facturaTotal
      }

      if (this.invoiceID() == 'new-Item') {

        this.ventaServices.createInvoice(invoiceData).subscribe((response) => {
          this.loading.set(false);
                if (response.success == false) {
                    console.error('❌ Error del backend:', response.error);
                    this.notificacionService.error(
                      'Ocurrio un problema al crear la factura',
                      'Error',
                      5000
                    );
                    return;
                }
          
                console.log('✅ Respuesta del backend:', response);
                this.notificacionService.success(
                    'Factura creada con exito',
                    'Accion Completada',
                    5000
                );

                setTimeout(() => {
                  this.router.navigateByUrl('/dashboard/ventas/comprobantes')
                }, 1500);  
        })

      }else{
        
      }




    }
 }

          