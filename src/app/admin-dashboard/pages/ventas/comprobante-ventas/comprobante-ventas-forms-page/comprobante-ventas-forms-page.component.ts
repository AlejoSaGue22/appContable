import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { FacturaVenta, ItemFactura } from './../../../../interfaces/documento-venta-interface';
import { AfterContentInit, Component, effect, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { ListGroupDropdownComponent } from "@shared/components/list-group-dropdown/list-group-dropdown.component";
import { forkJoin, map, tap } from 'rxjs';
import { FormErrorLabelComponent } from "src/app/utils/components/form-error-label/form-error-label.component";
import { ClientesService } from '../../services/clientes.service';
import { ProductosService } from '../../services/productos.service';
import { GetProductosDetalle, ArticulosInterface } from '@dashboard/interfaces/productos-interface';
import { ClientesInterface } from '@dashboard/interfaces/clientes-interface';
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { NotificationService } from '@shared/services/notification.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { ComprobantesVentasService } from '../../services/comprobantes-ventas.service';
import { LoaderService } from '@utils/services/loader.service';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { ClientsFormPageComponent } from '../../clientes/clients-form-page/clients-form-page.component';
import { ProductosServiciosFormsComponent } from '../../productos-servicios/productos-servicios-forms/productos-servicios-forms.component';

@Component({
  selector: 'app-comprobante-ventas-forms-page',
  standalone: true,
  imports: [
    HeaderTitlePageComponent,
    ReactiveFormsModule,
    ListGroupDropdownComponent,
    CurrencyPipe,
    DecimalPipe,
    FormErrorLabelComponent,
    RouterLink,
    ModalComponent,
    ClientsFormPageComponent,
    ProductosServiciosFormsComponent
  ],
  templateUrl: './comprobante-ventas-forms-page.component.html',
})
export class ComprobanteVentasFormsPageComponent implements OnInit {

  headTitle: HeaderInput = {
    title: 'Nueva Factura de Venta',
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
  getAllProductos = signal<GetProductosDetalle[]>([]);
  getAllClientes = signal<ClientesInterface[]>([]);
  activateRoute = inject(ActivatedRoute);
  loaderservice = inject(LoaderService);
  router = inject(Router);
  loading = signal<boolean>(false);

  invoiceID = toSignal(
    this.activateRoute.params.pipe(
      map((param) => param['id'])
    )
  );

  // ***** SECCION MODALES *****

  // Modal State
  isClientModalVisible = signal<boolean>(false);
  isProductModalVisible = signal<boolean>(false);

  // --- Client Modal Methods ---
  openClientModal() {
    this.isClientModalVisible.set(true);
  }

  closeClientModal() {
    this.isClientModalVisible.set(false);
  }

  onClientSaved(newClient: any) {
    // Add to the list
    // Note: getAllClientes is currently set from a service response. 
    // We might simply want to re-fetch or append. For now, appending locally.
    this.getAllClientes.update(list => [...list, newClient]);

    // Select it
    this.onClienteSeleccionado(newClient);

    this.closeClientModal();
    this.notificacionService.success('Cliente creado y seleccionado', 'Éxito');
  }

  // --- Product Modal Methods ---
  openProductModal() {
    this.isProductModalVisible.set(true);
  }

  closeProductModal() {
    this.isProductModalVisible.set(false);
  }

  onProductSaved(newProduct: any) {
    // Appending locally.
    this.getAllProductos.update(list => [...list, newProduct]);

    // Select it
    this.onProductoSeleccionado(newProduct);

    this.closeProductModal();
    this.notificacionService.success('Producto creado y seleccionado', 'Éxito');
  }

  // ***** FIN SECCION MODALES *****

  ngOnInit(): void {
    this.loaderservice.show();

    this.getClientesAndProductos();
    if (this.invoiceID() == 'new-Item') {
      this.formVentas.reset();
      this.productosItemsForm.reset();
      this.loaderservice.hide();
      return;
    }

    // Para modo edición, primero cargar clientes y productos, luego la factura
    this.headTitle.title = 'Editar Factura de Venta';
    this.headTitle.slog = 'Se edita factura de venta del sistema';
    this.loadInvoice(this.invoiceID());
  }

  getClientesAndProductos() {
    forkJoin({
      clientes: this.clienteServicios.getClientes({ limit: 10000, offset: 0 }),
      productos: this.productoServicios.getProductos({ limit: 10000, offset: 0, venta_compra: 'venta' })
    }).subscribe({
      next: ({ clientes, productos }) => {
        const clienteMap = clientes.clientes.map((item) => {
          return {
            nombre: item.nombre + item.apellido
          }
        })
        this.getAllClientes.set(clientes.clientes);
        this.getAllProductos.set(productos.articulos);
      },
      error: (error) => {
        console.log("Error Comprobantes Ventas: ", error);
        this.loaderservice.hide();
      }
    });
  }

  loadInvoice(id: string): void {

    this.ventaServices.getInvoiceById(id).subscribe({
      next: (response) => {

        const invoice = response.data[0];

        while (this.productSeleccionados().length > 0) {
          this.productSeleccionados().splice(0, 1);
        }

        this.formVentas.patchValue({
          cliente: invoice.clientId,
          tipoDocumento: invoice.client.tipoDocumento,
          identificacion: invoice.client.tipoDocumento + ' - ' + invoice.client.numeroDocumento,
          clienteSearch: invoice.client.nombre + ' ' + invoice.client.apellido,
          contacto: invoice.client.email,
          vendedor: invoice.vendedor,
          canal: invoice.canalventa,
          fecha: invoice.fecha,
          formaPago: invoice.formapago,
          metodoPago: invoice.metodoPago // Patching new field
        });

        this.productSeleccionados.set(invoice.items)
        this.calcularTotal()
        this.loaderservice.hide();
      },
      error: (err) => {
        this.loading.set(false);
        this.loaderservice.hide();
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
    metodoPago: [''], // Added field
    fecha: ['', Validators.required],
    canal: [''],
    productos: [[]]
  })

  // Listener for conditional validation
  paymentLogic = effect(() => {
    const formaPago = this.formVentas.get('formaPago')?.value;
    const metodoPagoControl = this.formVentas.get('metodoPago');

    if (formaPago === '1') { // Contado
      metodoPagoControl?.setValidators([Validators.required]);
    } else {
      metodoPagoControl?.clearValidators();
      metodoPagoControl?.setValue(''); // Reset if credit
    }
    metodoPagoControl?.updateValueAndValidity();
  });

  productosItemsForm = this.fb.group({
    articulo: ['', Validators.required],
    articuloId: ['', Validators.required],
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

  get productosArray() {
    return this.productSeleccionados();
  }

  async setProductos() {
    if (!this.productosItemsForm.valid) return;

    const valores = this.productosItemsForm.value as ItemFactura;
    console.log(valores);
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
      discount: valores.discount ?? 0,
      valor_discount: valores.discount ? ((this.productosItemsForm.value.quantity! * this.productosItemsForm.value.unitPrice!) *
        (valores.discount! / 100)) : 0,
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

  deleteProducto(id: string) {
    let index = this.productSeleccionados().findIndex(value => value.id == id)

    if (index != -1) {
      this.productSeleccionados().splice(index, 1);
      this.calcularTotal();
    }
  }

  reiniciarProducto() {
    this.productosItemsForm.reset({
      articulo: '',
      description: '',
      quantity: 0,
      unitPrice: 0,
      discount: 0,
      iva: 0,
    })
  }

  onClienteSeleccionado(cliente: Partial<ClientesInterface>) {
    this.formVentas.patchValue({
      cliente: cliente.id,
      clienteSearch: cliente.nombre,
      tipoDocumento: cliente.tipoDocumento,
      contacto: cliente.email,
      identificacion: cliente.tipoDocumento + ' - ' + cliente.numeroDocumento
    })
  }

  onProductoSeleccionado(producto: Partial<GetProductosDetalle>) {
    console.log("Producto seleccionado: ", producto);
    this.productosItemsForm.patchValue({
      unitPrice: producto.precio,
      iva: parseInt(producto.impuesto!),
      articuloId: producto.id
    })
  }

  calcularTotal() {

    this.totales.facturaTotal = this.productSeleccionados().reduce((accumulator, currentValue) => accumulator + currentValue.total!, 0);
    this.totales.subtotal = this.productSeleccionados().reduce((accu, current) => accu + current.subtotal!, 0);
    this.totales.retenciones = 0;
    this.totales.totalIVA = this.productSeleccionados().reduce((accu, current) => accu + current.valor_iva!, 0);
    this.totales.descuentoTotal = this.productSeleccionados().reduce((accu, current) => accu + current.valor_discount!, 0);

    console.log(this.totales);
  }

  async onSubmit() {

    const validFactura = this.formVentas.valid;
    const validProduct = this.productosItemsForm.valid;
    this.formVentas.markAllAsTouched();

    if (!validFactura) {
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
    const valueFormFactura = this.formVentas.value;
    const productos = this.productSeleccionados();

    const invoiceData: Partial<FacturaVenta> = {
      clientId: valueFormFactura.cliente!,
      vendedor: valueFormFactura.vendedor!,
      canalventa: valueFormFactura.canal!,
      fecha: valueFormFactura.fecha!,
      formapago: valueFormFactura.formaPago!,
      metodoPago: valueFormFactura.metodoPago!,
      items: productos.map((item) => ({
        articuloId: item.articuloId!,
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
          this.router.navigateByUrl('/panel/ventas/comprobantes')
        }, 1500);
      })

    } else {

    }

  }
}

