import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { FormErrorLabelComponent } from '@utils/components/form-error-label/form-error-label.component';
import { CommonModule, DecimalPipe } from '@angular/common';
import { ListGroupDropdownComponent } from '@shared/components/list-group-dropdown/list-group-dropdown.component';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { ProveedoresFormsPageComponent } from '../../proveedores/proveedores-forms-page/proveedores-forms-page.component';
import { ProductosCompraFormsComponent } from '../../productos-compra/productos-compra-forms/productos-compra-forms.component';
import { forkJoin, map } from 'rxjs';
import { ProveedoresService } from '../../services/proveedores.service';
import { ProductosService } from '@dashboard/pages/ventas/services/productos.service';
import { ProveedoresRequest } from '@dashboard/interfaces/proveedores-interface';
import { GetProductosDetalle } from '@dashboard/interfaces/productos-interface';
import { toSignal } from '@angular/core/rxjs-interop';
import { FacturaCompraService } from '../../services/factura-compra.service';
import { FacturaCompra, ItemFacturaResponse } from '@dashboard/interfaces/factura-compra-interface';
import { CatalogsStore } from '@dashboard/services/catalogs.store';
import { HelpersUtils } from '@utils/helpers.utils';
import { FormaPago } from '@dashboard/interfaces/documento-venta-interface';
import { LoaderComponent } from "@utils/components/loader/loader.component";
import { CuentasBancariasService } from '@dashboard/pages/contabilidad/services/cuentas-bancarias.service';
import { CuentaBancaria } from '@dashboard/pages/contabilidad/interfaces/cuenta-bancaria.interface';

@Component({
    selector: 'app-factura-compra-forms-page',
    standalone: true,
    imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    HeaderTitlePageComponent,
    FormErrorLabelComponent,
    ListGroupDropdownComponent,
    ModalComponent,
    ProveedoresFormsPageComponent,
    ProductosCompraFormsComponent,
],
    providers: [
        DecimalPipe
    ],
    templateUrl: './factura-compra-forms-page.component.html',
})
export class FacturaCompraFormsPageComponent implements OnInit {

    headTitle: HeaderInput = {
        title: 'Nueva Factura de Compra',
        slog: 'Registra una nueva compra a proveedores'
    };

    private fb = inject(FormBuilder);
    notificationService = inject(NotificationService);
    facturaService = inject(FacturaCompraService);
    loaderService = inject(LoaderService);
    proveedoresServicios = inject(ProveedoresService);
    productoServicios = inject(ProductosService);
    router = inject(Router);
    activatedRoute = inject(ActivatedRoute);
    catalogsStore = inject(CatalogsStore);
    cuentasBancariasService = inject(CuentasBancariasService);

    // Modal State
    isProviderModalVisible = signal<boolean>(false);
    isProductModalVisible = signal<boolean>(false);

    facturaId = toSignal(
        this.activatedRoute.params.pipe(
            map((params) => params['id'])
        )
    );

    totales = {
        subtotal: 0,
        descuentoTotal: 0,
        totalIVA: 0,
        retenciones: 0,
        facturaTotal: 0
    };

    // Mock Data Signals
    proveedoresList = signal<ProveedoresRequest[]>([]);
    productosList = signal<GetProductosDetalle[]>([]);
    cuentasBancarias = signal<CuentaBancaria[]>([]);

    formCompra = this.fb.group({
        proveedor: ['', Validators.required],
        proveedorSearch: [''],
        numeroIdentificacion: [''],
        tipoIdentificacion: [''],
        email: [''],
        telefono: [''],
        fechaEmision: [new Date().toISOString().substring(0, 10), Validators.required],
        fechaVencimiento: [''],
        formaPago: ['', Validators.required],
        metodoPago: [''],
        cuentaBancariaId: [''],
        referencia: ['', Validators.required],
        observaciones: [''],
        items: this.fb.array([])
    });

    setupPaymentLogic() {
        const applyValidation = (value: string | null) => {
            const metodoPagoControl = this.formCompra.get('metodoPago');
            const cuentaBancariaControl = this.formCompra.get('cuentaBancariaId');
            const fechaVencimientoControl = this.formCompra.get('fechaVencimiento');
            if (value === FormaPago.CONTADO) {
                metodoPagoControl?.setValidators([Validators.required]);
                cuentaBancariaControl?.setValidators([Validators.required]);
                fechaVencimientoControl?.clearValidators();
                fechaVencimientoControl?.setValue('');
            } else {
                fechaVencimientoControl?.setValidators([Validators.required]);
                metodoPagoControl?.clearValidators();
                metodoPagoControl?.setValue('');
                cuentaBancariaControl?.clearValidators();
                cuentaBancariaControl?.setValue('');
            }
            metodoPagoControl?.updateValueAndValidity();
            cuentaBancariaControl?.updateValueAndValidity();
            fechaVencimientoControl?.updateValueAndValidity();
        };

        this.formCompra.get('formaPago')?.valueChanges.subscribe(applyValidation);

        applyValidation(this.formCompra.get('formaPago')?.value || FormaPago.CONTADO);
    }


    loading = signal<boolean>(false);
    minDate = signal<string>(new Date().toISOString().substring(0, 10));

    productosItemsForm = this.fb.group({
        producto: [{ id: '', nombre: '' }, Validators.required],
        quantity: [1, [Validators.required, Validators.min(1)]],
        descripcion: [''],
        unitPrice: [0, [Validators.required, Validators.min(0)]],
        iva: [0, [Validators.min(0), Validators.max(100)]],
        discount: [0, [Validators.min(0), Validators.max(100)]],
        total: [0]
    });

    ngOnInit(): void {
        this.setupPaymentLogic();
        if (this.facturaId() && this.facturaId() !== 'new') {
            this.headTitle.title = 'Editar Factura de Compra';
            this.headTitle.slog = 'Se edita factura de compra del sistema';
            this.loadFactura(this.facturaId());
        }

        this.getProveedoresAndProductos();
        this.getCuentasBancarias();

        // React to product selection to auto-fill price and tax
        this.productosItemsForm.get('producto')?.valueChanges.subscribe((prod: GetProductosDetalle | any) => {
            if (prod) {
                this.productosItemsForm.patchValue({
                    unitPrice: prod.precio,
                    iva: prod.impuestoId,
                    quantity: 1,
                    discount: 0,
                    descripcion: prod.descripcion
                });
                this.calculateItemTotal();
            }
        });

        // React to changes in quantity, price, discount to update item total
        this.productosItemsForm.valueChanges.subscribe(() => {
            this.calculateItemTotal();
        });
    }

    getCuentasBancarias() {
        this.cuentasBancariasService.getCuentasBancos({ limit: 1000 }).subscribe({
            next: (res) => {
                this.cuentasBancarias.set(res.cuentas);
            },
            error: (err) => console.error('Error cargando cuentas bancarias', err)
        });
    }

    getProveedoresAndProductos() {
        this.loaderService.show();
        forkJoin({
            proveedores: this.proveedoresServicios.getProveedores({ limit: 10, offset: 0 }),
            productos: this.productoServicios.getProductos({ limit: 10, offset: 0, venta_compra: 'costo' })
        }).subscribe({
            next: ({ proveedores, productos }) => {
                this.proveedoresList.set(proveedores.proveedores);
                this.productosList.set(productos.articulos);
            },
            error: (error) => {
                this.notificationService.error('Error al cargar los datos de la factura de compra', error);
            },
            complete: () => {
                this.loaderService.hide();
            }
        });
    }

    loadFactura(id: string) {
        this.loaderService.show();
        this.facturaService.getFacturaCompraById(id).subscribe({
            next: (factura) => {
                if (factura.success) {
                    const invoice = factura.data.data[0]!;

                    while (this.items.length > 0) {
                        this.items.removeAt(0);
                    }

                    invoice.items.forEach((item: ItemFacturaResponse) => {
                        this.addItem();
                        this.items.at(this.items.length - 1)?.patchValue({
                            productoId: item.articuloId,
                            productoNombre: item.articulo?.nombre,
                            cantidad: item.quantity,
                            precioUnitario: item.unitPrice,
                            iva: item.porcentajeIva,
                            impuestoId: item.impuestoId || '',
                            descuento: item.descuento,
                            subtotal: item.valorSubtotal,
                            total: item.itemTotal,
                            descripcion: item.descripcion || ''
                        });
                    });

                    this.formCompra.patchValue({
                        proveedorSearch: invoice.proveedor?.nombre,
                        proveedor: invoice.proveedorId,
                        numeroIdentificacion: invoice.proveedor?.identificacion,
                        email: invoice.proveedor?.email,
                        telefono: invoice.proveedor?.telefono,
                        fechaEmision: invoice.fecha,
                        fechaVencimiento: invoice.fechaVencimiento,
                        formaPago: invoice.formaPago,
                        metodoPago: invoice.metodoPago, // Assuming it exists in backend
                        cuentaBancariaId: invoice.cuentaBancariaId,
                        referencia: invoice.numeroFacturaProveedor,
                        observaciones: invoice.observaciones,
                    });
                    this.totales.facturaTotal = invoice.total;
                    this.totales.subtotal = invoice.subtotal;
                    this.totales.totalIVA = invoice.iva;
                    this.totales.descuentoTotal = invoice.descuento;
                }
            },
            error: (error) => {
                this.notificationService.error('Error al cargar los datos de la factura de compra', error);
            },
            complete: () => {
                this.loaderService.hide();
            }

        });
    }

    getIvaTarifa(ivaValue: any): number {
        if (!ivaValue) return 0;
        if (typeof ivaValue === 'number') return ivaValue;
        const impuesto = this.catalogsStore.impuestos().find(i => i.id == ivaValue);
        const tarifa = impuesto?.tarifa ? parseInt(impuesto.tarifa) : 0
        return tarifa;
    }

    calculateItemTotal() {
        const val = this.productosItemsForm.value;
        const subtotal = (val.quantity || 0) * (val.unitPrice || 0);
        const discountAmount = subtotal * ((val.discount || 0) / 100);
        const tarifa = this.getIvaTarifa(val.iva);
        const taxAmount = (subtotal - discountAmount) * (tarifa / 100);
        const total = subtotal - discountAmount + taxAmount;

        this.productosItemsForm.patchValue({ total: total }, { emitEvent: false });
    }

    get items(): FormArray {
        return this.formCompra.get('items') as FormArray;
    }

    addItem() {
        if (this.productosItemsForm.invalid) return;

        const itemVal = this.productosItemsForm.value;
        const subtotal = (itemVal.quantity || 0) * (itemVal.unitPrice || 0);
        const tarifa = this.getIvaTarifa(itemVal.iva);

        const newItem = this.fb.group({
            productoId: [itemVal.producto?.id],
            productoNombre: [itemVal.producto?.nombre],
            cantidad: [itemVal.quantity],
            precioUnitario: [itemVal.unitPrice],
            iva: [tarifa],
            impuestoId: [itemVal.iva],
            descuento: [itemVal.discount],
            subtotal: [subtotal],
            total: [itemVal.total]
        });

        this.items.push(newItem);
        this.productosItemsForm.reset({ producto: { id: '', nombre: '' }, quantity: 1, unitPrice: 0, iva: 0, discount: 0, total: 0 });
        this.calculateItemTotal();
        this.calcularTotal();

    }

    removeItem(index: number) {
        this.items.removeAt(index);
        this.calcularTotal();
    }

    calcularTotal() {
        this.totales.subtotal = 0;
        this.totales.descuentoTotal = 0;
        this.totales.totalIVA = 0;
        this.totales.facturaTotal = 0;
        this.totales.retenciones = 0;

        const items = this.formCompra.controls.items.value;
        items.forEach((item: any) => {
            const itemSubtotal = item.cantidad * item.precioUnitario;
            const itemDesc = itemSubtotal * (item.descuento / 100);
            const tarifa = item.iva || 0;
            const itemTax = (itemSubtotal - itemDesc) * (tarifa / 100);

            this.totales.subtotal += itemSubtotal;
            this.totales.descuentoTotal += itemDesc;
            this.totales.totalIVA += itemTax;
            this.totales.facturaTotal += item.total;
        });

    }

    // Computeds for Totals
    resumenTotales = computed(() => {
        const items = this.formCompra.controls.items.value;
        let subtotal = 0;
        let impuestos = 0;
        let descuentos = 0;

        items.forEach((item: any) => {
            const itemSubtotal = item.cantidad * item.precioUnitario;
            const itemDesc = itemSubtotal * (item.descuento / 100);
            const tarifa = item.iva || 0;
            const itemTax = (itemSubtotal - itemDesc) * (tarifa / 100);

            subtotal += itemSubtotal;
            descuentos += itemDesc;
            impuestos += itemTax;
        });

        return {
            subtotal,
            descuentos,
            impuestos,
            total: subtotal - descuentos + impuestos
        };
    });


    onSubmit(isDraft: boolean) {
        this.formCompra.markAllAsTouched();
        if (this.formCompra.invalid) {
            this.notificationService.error(
                'Por favor, completa los campos requeridos.',
                'Campos no validos',
                5000
            );
            return;
        }

        if (this.formCompra.controls.items.value.length === 0) {
            this.notificationService.error(
                'Por favor, agrega al menos un item.',
                'Items no validos',
                5000
            );
            return;
        }

        this.loading.set(true);
        this.loaderService.show('Guardando factura de compra...');
        const factura = this.formCompra.value;
        const items = this.formCompra.controls.items.value;

        const invoiceData: Partial<FacturaCompra> = {
            isDraft,
            proveedorId: factura.proveedor!,
            fecha: factura.fechaEmision!,
            numeroFacturaProveedor: factura.referencia || '',
            observaciones: factura.observaciones || '',
            fechaVencimiento: factura.fechaVencimiento || '',
            formaPago: factura.formaPago!,
            metodoPago: factura.metodoPago || '',
            cuentaBancariaId: factura.cuentaBancariaId || '',
            items: items.map((item: any) => ({
                articuloId: item.productoId,
                quantity: item.cantidad,
                unitPrice: item.precioUnitario,
                iva: item.iva,
                impuestoId: item.impuestoId,
                discount: item.descuento,
                descripcion: item.descripcion || ''
            })),
            subtotal: this.totales.subtotal,
            descuento: this.totales.descuentoTotal,
            iva: this.totales.totalIVA,
            total: this.totales.facturaTotal,
            // retenciones: this.totales.retenciones,
        };

        // Log removed

        if (this.facturaId() == 'new') {
            this.facturaService.createFacturaCompra(invoiceData).subscribe((response) => {
                this.loading.set(false);
                if (response.success == false) {
                    this.notificationService.error(
                        `Ocurrio un problema al crear la factura ${HelpersUtils.getMessageError(response.message)}`,
                        'Error',
                        5000
                    );
                    return;
                }

                this.notificationService.success(
                    'Factura creada con exito',
                    'Accion Completada',
                    5000
                );


                setTimeout(() => {
                    this.loaderService.hide();
                    this.router.navigateByUrl('/panel/compras/purchases')
                }, 800);
            });

        } else {
            this.updateFactura(this.facturaId(), invoiceData);
        }

    }

    updateFactura(id: string, data: Partial<FacturaCompra>) {
        this.facturaService.updateFacturaCompra(id, data).subscribe((response) => {
            this.loading.set(false);
            if (response.success == false) {
                this.notificationService.error(
                    `Ocurrio un problema al actualizar la factura ${HelpersUtils.getMessageError(response.message)}`,
                    'Error',
                    5000
                );
                return;
            }

            this.notificationService.success(
                'Factura actualizada con exito',
                'Accion Completada',
                5000
            );

            setTimeout(() => {
                this.loaderService.hide();
                this.router.navigateByUrl('/panel/compras/purchases')
            }, 1500);
        });
    }

    // --- Modal Handling ---
    openProviderModal() {
        this.isProviderModalVisible.set(true);
    }

    closeProviderModal() {
        this.isProviderModalVisible.set(false);
    }

    onProviderSaved(newProvider: any) {
        this.proveedoresList.update(list => [...list, newProvider]);

        const nombreDisplay = newProvider.nombre?.trim() || newProvider.razonSocial?.trim() || '';
        const abreviatura = newProvider.tipoDocumentoRel?.abreviatura || '';

        this.formCompra.patchValue({
            proveedor: newProvider.id,
            proveedorSearch: nombreDisplay,
            numeroIdentificacion: abreviatura ? `${abreviatura} - ${newProvider.identificacion}` : newProvider.identificacion,
            tipoIdentificacion: abreviatura,
            telefono: newProvider.telefono,
            email: newProvider.email,
        });
        
        this.closeProviderModal();
    }


    openProductModal() {
        this.isProductModalVisible.set(true);
    }

    closeProductModal() {
        this.isProductModalVisible.set(false);
    }

    onProductSaved(newProduct: any) { 
        // Add new product to list
        this.productosList.update(list => [...list, newProduct]);

        // Select the new product in the item form
        this.productosItemsForm.patchValue({ producto: newProduct });

        this.closeProductModal();
        this.notificationService.success('Producto creado y seleccionado', 'Listo');
    }

}

