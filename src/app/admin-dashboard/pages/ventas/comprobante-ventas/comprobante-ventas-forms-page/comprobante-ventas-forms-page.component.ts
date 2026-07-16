import { CurrencyPipe, DatePipe } from '@angular/common';
import {
  FacturaVenta,
  FormaPago,
  ItemFactura,
  TipoFactura,
  InvoiceStatus,
} from './../../../../interfaces/documento-venta-interface';
import { PreviewAsientoComponent } from '@dashboard/components/preview-asiento/preview-asiento.component';
import {
  AfterContentInit,
  Component,
  effect,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  HeaderInput,
  HeaderTitlePageComponent,
} from '@dashboard/components/header-title-page/header-title-page.component';
import { ListGroupDropdownComponent } from '@shared/components/list-group-dropdown/list-group-dropdown.component';
import { forkJoin, map, tap } from 'rxjs';
import { FormErrorLabelComponent } from 'src/app/utils/components/form-error-label/form-error-label.component';
import { ClientesService } from '../../services/clientes.service';
import { ProductosService } from '../../services/productos.service';
import {
  GetProductosDetalle,
  ArticulosInterface,
} from '@dashboard/interfaces/productos-interface';
import { ClientesInterfaceResponse } from '@dashboard/interfaces/clientes-interface';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NotificationService } from '@shared/services/notification.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { ComprobantesVentasService } from '../../services/comprobantes-ventas.service';
import { LoaderService } from '@utils/services/loader.service';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { ClientsFormPageComponent } from '../../clientes/clients-form-page/clients-form-page.component';
import { CatalogsStore } from '@dashboard/services/catalogs.store';
import { HelpersUtils } from '@utils/helpers.utils';
import { CuentasBancariasService } from '@dashboard/pages/contabilidad/services/cuentas-bancarias.service';
import { CuentaBancaria } from '@dashboard/pages/contabilidad/interfaces/cuenta-bancaria.interface';
import { ProductosServiciosFormsComponent } from '@dashboard/pages/articulos/productos-servicios-forms/productos-servicios-forms.component';

@Component({
  selector: 'app-comprobante-ventas-forms-page',
  standalone: true,
  imports: [
    HeaderTitlePageComponent,
    ReactiveFormsModule,
    ListGroupDropdownComponent,
    CurrencyPipe,
    DatePipe,
    FormErrorLabelComponent,
    RouterLink,
    ModalComponent,
    ClientsFormPageComponent,
    ProductosServiciosFormsComponent,
    PreviewAsientoComponent,
  ],
  templateUrl: './comprobante-ventas-forms-page.component.html',
})
export class ComprobanteVentasFormsPageComponent implements OnInit {
  headTitle: HeaderInput = {
    title: 'Nueva Factura de Venta',
    slog: 'Se registra nueva factura de venta al sistema',
  };

  totales = {
    subtotal: 0,
    totalIVA: 0,
    descuentoTotal: 0,
    impuestos: 0,
    retenciones: 0,
    facturaTotal: 0,
    importe: 0,
  };

  private fb = inject(FormBuilder);
  clienteServicios = inject(ClientesService);
  productoServicios = inject(ProductosService);
  ventaServices = inject(ComprobantesVentasService);
  notificacionService = inject(NotificationService);
  activateRoute = inject(ActivatedRoute);
  loaderservice = inject(LoaderService);
  router = inject(Router);
  catalogsStore = inject(CatalogsStore);
  cuentasBancariasService = inject(CuentasBancariasService);
  factura = signal<FacturaVenta | null>(null);
  productSeleccionados = signal<ItemFactura[]>([]);
  getAllProductos = signal<GetProductosDetalle[]>([]);
  getAllClientes = signal<ClientesInterfaceResponse[]>([]);
  cuentasBancarias = signal<CuentaBancaria[]>([]);
  loading = signal<boolean>(false);
  minDate = signal<string>(new Date().toISOString().substring(0, 10));
  refreshAsientoTrigger = signal<number>(0);
  anticiposDisponibles = signal<any[]>([]);
  anticiposAsociados = signal<{ anticipoId: string; numero: string; montoOriginal: number; saldoDisponible: number; montoAplicado: number }[]>([]);

  invoiceID = toSignal(
    this.activateRoute.params.pipe(map((param) => param['id'])),
  );

  // ***** SECCION MODALES *****

  isClientModalVisible = signal<boolean>(false);
  isProductModalVisible = signal<boolean>(false);

  openClientModal() {
    this.isClientModalVisible.set(true);
  }

  closeClientModal() {
    this.isClientModalVisible.set(false);
  }

  onClientSaved(newClient: any) {
    this.getAllClientes.update((list) => [...list, newClient]);
    this.onClienteSeleccionado(newClient);
    this.closeClientModal();
  }

  // --- Product Modal Methods ---
  openProductModal() {
    this.isProductModalVisible.set(true);
  }

  closeProductModal() {
    this.isProductModalVisible.set(false);
  }

  onProductSaved(newProduct: any) {
    this.getAllProductos.update((list) => [...list, newProduct]);
    this.onProductoSeleccionado(newProduct);
    this.closeProductModal();
    this.notificacionService.success('Producto creado y seleccionado', 'Éxito');
  }

  // ***** FIN SECCION MODALES *****

  ngOnInit(): void {
    this.loaderservice.show();

    this.getClientesAndProductos();
    this.loadCuentasBancarias();
    if (this.invoiceID() == 'new-Item') {
      this.loaderservice.hide();
      return;
    }

    this.headTitle.title = 'Editar Factura de Venta';
    this.headTitle.slog = 'Se edita factura de venta del sistema';
    this.loadInvoice(this.invoiceID());
  }

  loadCuentasBancarias() {
    this.cuentasBancariasService
      .getCuentasBancos({ offset: 0, limit: 100 })
      .subscribe({
        next: (res) => this.cuentasBancarias.set(res.cuentas),
        error: (err) =>
          this.notificacionService.error(
            'Error al cargar cuentas bancarias',
            err,
          ),
      });
  }

  getClientesAndProductos() {
    forkJoin({
      clientes: this.clienteServicios.getClientes({ limit: 10, offset: 0 }),
      productos: this.productoServicios.getProductos({
        limit: 10,
        offset: 0,
        // venta_compra: 'venta',
      }),
    }).subscribe({
      next: ({ clientes, productos }) => {
        const clienteMap = clientes.clientes.map((item) => {
          return {
            nombre: item.nombre + item.apellido,
          };
        });
        this.getAllClientes.set(clientes.clientes);
        this.getAllProductos.set(productos.articulos);
      },
      error: (error) => {
        // Log removed

        this.loaderservice.hide();
      },
    });
  }

  loadInvoice(id: string): void {
    this.ventaServices.getInvoiceById(id).subscribe({
      next: (response) => {
        const invoice = response.data[0];
        const cliente = invoice.client;
        const nombreDisplay = cliente.razonSocial?.trim()
          ? cliente.razonSocial
          : `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim();
        const abreviatura = cliente.tipoDocumentoRel?.abreviatura || '';

        this.formVentas.patchValue({
          cliente: invoice.clientId,
          tipoFactura: invoice.tipoFactura || '',
          tipoDocumento: cliente.tipoDocumento,
          identificacion: abreviatura
            ? `${abreviatura} - ${cliente.numeroDocumento}`
            : cliente.numeroDocumento,
          clienteSearch: nombreDisplay,
          contacto: cliente.email,
          vendedor: invoice.vendedor,
          canal: invoice.canalVenta,
          fecha: invoice.fecha,
          formaPago: invoice.formaPago,
          metodoPago: invoice.metodoPago,
          cuentaBancariaId: (invoice as any).cuentaBancariaId || '',
          fechaVencimiento: invoice.fechaVencimiento,
        });

        this.factura.set(invoice as any);
        this.productSeleccionados.set(invoice.items as ItemFactura[]);
        this.calcularTotal();

        // Cargar anticipos cruzados/aplicados a esta factura
        this.ventaServices.getAplicacionesAnticipo(id).subscribe({
          next: (appRes) => {
            const apps = appRes.data || [];
            this.anticiposAsociados.set(apps.map((app: any) => ({
              anticipoId: app.anticipoId,
              numero: app.anticipo?.numero || '',
              montoOriginal: app.anticipo?.montoOriginal || 0,
              saldoDisponible: app.anticipo?.saldoDisponible || 0,
              montoAplicado: app.montoAplicado
            })));

            // Cargar también todos los disponibles para el cliente
            if (invoice.clientId) {
              this.cargarAnticiposDisponibles(invoice.clientId);
            }
            this.loaderservice.hide();
          },
          error: (err) => {
            if (invoice.clientId) {
              this.cargarAnticiposDisponibles(invoice.clientId);
            }
            this.loaderservice.hide();
          }
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.loaderservice.hide();
      },
    });
  }

  formVentas = this.fb.group({
    cliente: ['', Validators.required],
    clienteSearch: [''],
    tipoDocumento: ['', Validators.required],
    identificacion: ['', Validators.required],
    contacto: [''],
    vendedor: [''],
    formaPago: [FormaPago.CONTADO, Validators.required],
    metodoPago: [''],
    cuentaBancariaId: [''],
    fechaVencimiento: [''],
    fecha: ['', Validators.required],
    canal: ['', Validators.required],
    tipoFactura: [TipoFactura.STANDARD, Validators.required],
    productos: [[]],
  });

  tipoFacturaSignal = toSignal(
    this.formVentas.get('tipoFactura')!.valueChanges,
    { initialValue: this.formVentas.get('tipoFactura')?.value as TipoFactura },
  );

  formaPagoSignal = toSignal(this.formVentas.get('formaPago')!.valueChanges, {
    initialValue: this.formVentas.get('formaPago')?.value as FormaPago,
  });

  paymentLogic = effect(() => {
    const formaPago = this.formaPagoSignal();
    const metodoPagoControl = this.formVentas.get('metodoPago');
    const cuentaBancariaControl = this.formVentas.get('cuentaBancariaId');
    const fechaVencimientoControl = this.formVentas.get('fechaVencimiento');

    if (formaPago === FormaPago.CONTADO) {
      metodoPagoControl?.setValidators([Validators.required]);
      cuentaBancariaControl?.setValidators([Validators.required]);
      fechaVencimientoControl?.clearValidators();
    } else {
      metodoPagoControl?.clearValidators();
      metodoPagoControl?.setValue('');
      cuentaBancariaControl?.clearValidators();
      cuentaBancariaControl?.setValue('');
      fechaVencimientoControl?.setValidators([Validators.required]);
    }
    metodoPagoControl?.updateValueAndValidity();
    cuentaBancariaControl?.updateValueAndValidity();
    fechaVencimientoControl?.updateValueAndValidity();
  });

  ivaLogic = effect(() => {
    const tipoFactura = this.tipoFacturaSignal();
    const ivaControl = this.productosItemsForm.get('iva');

    if (tipoFactura === TipoFactura.STANDARD) {
      ivaControl?.setValue(0);
      ivaControl?.disable();
    } else {
      ivaControl?.enable();
    }

    if (this.invoiceID() == 'new-Item') {
      this.productSeleccionados.set([]);
    }
  });

  productosItemsForm = this.fb.group({
    articulo: ['', Validators.required],
    articuloId: ['', Validators.required],
    description: [''],
    quantity: [1, [Validators.required, Validators.min(1)]],
    unitPrice: [0, [Validators.required, Validators.min(0)]],
    iva: [0],
    iva_valor: [0],
    discount: [0, [Validators.min(0), Validators.max(100)]],
    descuento_valor: [0],
    subtotal: [0],
    importe: [0],
    total: [0],
  });

  get productosArray() {
    return this.productSeleccionados();
  }

  async setProductos() {
    if (!this.productosItemsForm.valid) return;

    const valores = this.productosItemsForm.value as ItemFactura;
    const valorItemTotal = this.calcularItemTotal();
    const valorItemImporte = this.calcularDescuentoImporte();
    const tarifa = this.getIvaTarifa(valores.iva);

    const nuevoItemConId = {
      ...valores,
      id: this.generateUUID(),
      subtotal:
        this.productosItemsForm.value.quantity! *
        this.productosItemsForm.value.unitPrice!,
      importe: valorItemImporte,
      iva: tarifa,
      impuestoId: typeof valores.iva === 'string' ? valores.iva : '',
      valor_iva:
        this.productosItemsForm.value.quantity! *
        this.productosItemsForm.value.unitPrice! *
        (tarifa / 100),
      discount: valores.discount ?? 0,
      valor_discount: valores.discount
        ? this.productosItemsForm.value.quantity! *
        this.productosItemsForm.value.unitPrice! *
        (valores.discount! / 100)
        : 0,
      total: valorItemTotal,
    };

    this.productSeleccionados().push(nuevoItemConId);
    this.calcularTotal();
    this.reiniciarProducto();
  }

  generateUUID(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  getIvaTarifa(ivaValue: any): number {
    if (!ivaValue) return 0;
    if (typeof ivaValue === 'number') return ivaValue;
    const impuesto = this.catalogsStore
      .impuestos()
      .find((i) => i.id == ivaValue);
    const tarifa = impuesto?.tarifa ? parseInt(impuesto.tarifa) : 0;
    return tarifa;
  }

  calcularItemTotal(): number {
    const tarifa = this.getIvaTarifa(this.productosItemsForm.value.iva);

    const valorNeto =
      this.productosItemsForm.value.quantity! *
      this.productosItemsForm.value.unitPrice!;
    const descuentoAplicado =
      valorNeto * (this.productosItemsForm.value.discount! / 100);
    const valorDescontado = valorNeto - descuentoAplicado;
    const impuestoAplicado = valorDescontado * (tarifa / 100);

    return valorDescontado + impuestoAplicado;
  }

  calcularDescuentoImporte(): number {
    const valorNeto =
      this.productosItemsForm.value.quantity! *
      this.productosItemsForm.value.unitPrice!;
    const descuentoAplicado =
      valorNeto * (this.productosItemsForm.value.discount! / 100);
    const valorDescontado = valorNeto - descuentoAplicado;

    return valorDescontado;
  }

  deleteProducto(id: string) {
    let index = this.productSeleccionados().findIndex(
      (value) => value.id == id,
    );

    if (index != -1) {
      this.productSeleccionados().splice(index, 1);
      this.calcularTotal();
    }
  }

  reiniciarProducto() {
    this.productosItemsForm.reset({
      articulo: '',
      articuloId: '',
      description: '',
      quantity: 0,
      unitPrice: 0,
      discount: 0,
      iva: 0,
    });
  }

  onClienteSeleccionado(cliente: Partial<ClientesInterfaceResponse>) {
    const nombreDisplay = cliente.razonSocial?.trim()
      ? cliente.razonSocial
      : `${cliente.nombre || ''} ${cliente.apellido || ''}`.trim();
    const abreviatura = cliente.tipoDocumentoRel?.abreviatura || '';

    this.formVentas.patchValue({
      cliente: cliente.id,
      clienteSearch: nombreDisplay,
      tipoDocumento: cliente.tipoDocumento,
      contacto: cliente.email,
      identificacion: abreviatura
        ? `${abreviatura} - ${cliente.numeroDocumento}`
        : cliente.numeroDocumento,
    });

    // Resetear asociados anteriores al cambiar de cliente
    this.anticiposAsociados.set([]);

    if (cliente.id) {
      this.cargarAnticiposDisponibles(cliente.id);
    }
  }

  cargarAnticiposDisponibles(clienteId: string) {
    this.ventaServices.getAnticiposDisponibles(clienteId).subscribe({
      next: (res) => {
        const asociadosIds = this.anticiposAsociados().map(a => a.anticipoId);
        const disponibles = (res.data || []).filter((a: any) => !asociadosIds.includes(a.id));
        this.anticiposDisponibles.set(disponibles);
      },
      error: (err) => {
        this.notificacionService.error('Error al cargar anticipos del cliente', err);
      }
    });
  }

  toggleAnticipo(anticipo: any, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      const saldoPendienteFactura = this.obtenerSaldoPendienteAntesAnticipos();
      const montoSugerido = Math.min(anticipo.saldoDisponible, saldoPendienteFactura);

      this.anticiposAsociados.update(list => [...list, {
        anticipoId: anticipo.id,
        numero: anticipo.numero,
        montoOriginal: anticipo.montoOriginal,
        saldoDisponible: anticipo.saldoDisponible,
        montoAplicado: montoSugerido > 0 ? montoSugerido : 0
      }]);
      this.anticiposDisponibles.update(list => list.filter(a => a.id !== anticipo.id));
    }
  }

  desasociarAnticipo(asoc: any) {
    this.anticiposDisponibles.update(list => [...list, {
      id: asoc.anticipoId,
      numero: asoc.numero,
      montoOriginal: asoc.montoOriginal,
      saldoDisponible: asoc.saldoDisponible
    }]);
    this.anticiposAsociados.update(list => list.filter(a => a.anticipoId !== asoc.anticipoId));
  }

  cambiarMontoAplicado(asoc: any, event: Event) {
    const inputVal = Number((event.target as HTMLInputElement).value) || 0;
    let finalVal = Math.min(inputVal, asoc.saldoDisponible);

    const otrosAnticiposSuma = this.anticiposAsociados()
      .filter(a => a.anticipoId !== asoc.anticipoId)
      .reduce((sum, a) => sum + a.montoAplicado, 0);

    const maxValPermitido = Math.max(0, this.totales.facturaTotal - otrosAnticiposSuma);
    finalVal = Math.min(finalVal, maxValPermitido);

    this.anticiposAsociados.update(list => list.map(a => {
      if (a.anticipoId === asoc.anticipoId) {
        return { ...a, montoAplicado: finalVal };
      }
      return a;
    }));
  }

  obtenerSaldoPendienteAntesAnticipos(): number {
    const sumaAplicados = this.anticiposAsociados().reduce((sum, a) => sum + a.montoAplicado, 0);
    return Math.max(0, this.totales.facturaTotal - sumaAplicados);
  }

  obtenerMontoTotalAnticipos(): number {
    return this.anticiposAsociados().reduce((sum, a) => sum + a.montoAplicado, 0);
  }

  onProductoSeleccionado(producto: Partial<GetProductosDetalle>) {
    this.productosItemsForm.patchValue({
      unitPrice: producto.precio,
      iva: (producto.impuestoId ?? 0) as any,
      articuloId: producto.id,
    });
  }

  calcularTotal() {
    this.totales.facturaTotal = this.productSeleccionados().reduce(
      (accumulator, currentValue) => accumulator + currentValue.total!,
      0,
    );
    this.totales.subtotal = this.productSeleccionados().reduce(
      (accu, current) => accu + current.subtotal!,
      0,
    );
    this.totales.retenciones = 0;
    this.totales.totalIVA = this.productSeleccionados().reduce(
      (accu, current) => accu + current.valor_iva!,
      0,
    );
    this.totales.descuentoTotal = this.productSeleccionados().reduce(
      (accu, current) => accu + current.valor_discount!,
      0,
    );

    // Log removed
  }

  async onSubmit(saveAsDraft?: boolean) {
    const validFactura = this.formVentas.valid;
    const validProduct = this.productosItemsForm.valid;
    this.formVentas.markAllAsTouched();

    if (!validFactura) {
      const invalidFields = [];
      const controls = this.formVentas.controls;
      for (const name in controls) {
        if (controls[name as keyof typeof controls].invalid) {
          invalidFields.push(name);
        }
      }

      this.notificacionService.error(
        `Por favor, completa los campos requeridos: ${invalidFields.join(', ')}`,
        'Campos no validos',
        5000,
      );
      return;
    }

    if (this.productSeleccionados().length == 0) {
      this.notificacionService.error(
        'Debes agregar productos a la factura',
        'Error',
        5000,
      );
      return;
    }

    this.loaderservice.show('Guardando factura de venta...');
    this.loading.set(true);
    const valueFormFactura = this.formVentas.value;
    const productos = this.productSeleccionados();

    const invoiceData: any = {
      clientId: valueFormFactura.cliente!,
      vendedor: valueFormFactura.vendedor!,
      canalVenta: valueFormFactura.canal!,
      fecha: valueFormFactura.fecha!,
      formaPago: valueFormFactura.formaPago!,
      metodoPago: valueFormFactura.metodoPago!,
      cuentaBancariaId: valueFormFactura.cuentaBancariaId || undefined,
      fechaVencimiento: valueFormFactura.fechaVencimiento!,
      tipoFactura: valueFormFactura.tipoFactura!,
      items: productos.map((item) => ({
        articuloId: item.articuloId!,
        description: item.description,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        iva: item.iva,
        impuestoId: item.impuestoId,
        discount: item.discount,
        importe: item.importe,
      })),
      subtotal: this.totales.subtotal,
      iva: this.totales.totalIVA,
      descuento: this.totales.descuentoTotal,
      total: this.totales.facturaTotal,
      saveAsDraft: saveAsDraft,
      anticiposAsociados: this.anticiposAsociados().map(a => ({
        anticipoId: a.anticipoId,
        montoAplicado: a.montoAplicado
      }))
    };

    if (this.invoiceID() == 'new-Item') {
      this.ventaServices.createInvoice(invoiceData).subscribe((response) => {
        if (response.success == false) {
          this.loading.set(false);
          this.loaderservice.hide();
          this.notificacionService.error(
            `Ocurrio un problema al crear la factura ${HelpersUtils.getMessageError(response.message)}`,
            'Error',
            5000,
          );
          return;
        }

        const msg = saveAsDraft
          ? 'Factura guardada como borrador'
          : 'Factura creada con exito';
        this.notificacionService.success(msg, 'Accion Completada', 5000);

        setTimeout(() => {
          this.loading.set(false);
          this.loaderservice.hide();
          if (saveAsDraft) {
            const invoiceId = response.data?.id || (response as any).id;
            if (invoiceId) {
              this.router.navigate(['/panel/ventas/comprobantes', invoiceId]);
            } else {
              this.router.navigateByUrl('/panel/ventas/comprobantes');
            }
          } else {
            this.router.navigateByUrl('/panel/ventas/comprobantes');
          }
        }, 800);
      });
    } else {
      const currentInvoice = this.factura();
      if (currentInvoice && currentInvoice.status !== InvoiceStatus.DRAFT) {
        this.loading.set(false);
        this.loaderservice.hide();
        this.notificacionService.error(
          'Solo se pueden editar facturas en estado borrador.',
          'Acción denegada',
          5000,
        );
        return;
      }

      this.ventaServices
        .updateInvoice(this.invoiceID(), invoiceData)
        .subscribe((response) => {
          this.loading.set(false);
          if (response.success == false) {
            this.notificacionService.error(
              `Ocurrio un problema al actualizar la factura ${HelpersUtils.getMessageError(response.message)}`,
              'Error',
              5000,
            );
            return;
          }

          this.notificacionService.success(
            'Factura actualizada con exito',
            'Accion Completada',
            5000,
          );

          setTimeout(() => {
            this.loaderservice.hide();
            if (saveAsDraft) {
              this.refreshAsientoTrigger.update(v => v + 1);
            } else {
              this.router.navigateByUrl('/panel/ventas/comprobantes');
            }
          }, 800);
        });
    }
  }

  onEmitirFromDraft() {
    const currentInvoice = this.factura();
    if (!currentInvoice || currentInvoice.status !== InvoiceStatus.DRAFT) {
      this.notificacionService.error(
        'Solo se pueden emitir facturas en estado borrador.',
        'Acción denegada',
        5000,
      );
      return;
    }

    this.loaderservice.show('Emitiendo factura...');
    this.loading.set(true);

    this.ventaServices
      .emitirEstandarInvoice(currentInvoice.id)
      .subscribe((response) => {
        this.loading.set(false);
        this.loaderservice.hide();
        if (response.success == false) {
          this.notificacionService.error(
            `Ocurrio un problema al emitir la factura ${HelpersUtils.getMessageError(response.message)}`,
            'Error',
            5000,
          );
          return;
        }

        this.notificacionService.success(
          'Factura emitida con exito',
          'Accion Completada',
          5000,
        );
        setTimeout(() => {
          this.router.navigateByUrl('/panel/ventas/comprobantes');
        }, 800);
      });
  }
}
