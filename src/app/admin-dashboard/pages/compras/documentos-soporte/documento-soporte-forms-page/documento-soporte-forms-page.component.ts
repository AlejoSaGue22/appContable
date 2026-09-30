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
import { forkJoin, map } from 'rxjs';
import { ProveedoresService } from '../../services/proveedores.service';
import { ProductosService } from '@dashboard/pages/ventas/services/productos.service';
import { ProveedoresRequest } from '@dashboard/interfaces/proveedores-interface';
import { GetProductosDetalle } from '@dashboard/interfaces/productos-interface';
import { toSignal } from '@angular/core/rxjs-interop';
import { DocumentosSoporteService } from '../../services/documentos-soporte.service';
import { DocumentoSoporte, ItemDocumentoSoporte } from '@dashboard/interfaces/documento-soporte-interface';
import { FacturaNotasResumen } from '@dashboard/interfaces/documento-venta-interface';
import { CatalogsStore } from '@dashboard/services/catalogs.store';
import { HelpersUtils } from '@utils/helpers.utils';
import { avisarAdvertenciasInventario } from '@dashboard/services/inventario.service';
import { FormaPago } from '@dashboard/interfaces/documento-venta-interface';
import { PreviewAsientoComponent } from '@dashboard/components/preview-asiento/preview-asiento.component';
import { LoaderComponent } from "@utils/components/loader/loader.component";
import { CuentasBancariasService } from '@dashboard/pages/contabilidad/services/cuentas-bancarias.service';
import { CuentaBancaria } from '@dashboard/pages/contabilidad/interfaces/cuenta-bancaria.interface';
import { ProductosServiciosFormsComponent } from '@dashboard/pages/articulos/productos-servicios-forms/productos-servicios-forms.component';
import { CuentasContablesService } from '@dashboard/pages/contabilidad/services/cuentas-contables.service';
import { GetCuentasContables } from '@dashboard/pages/contabilidad/interfaces/cuentas-contables.interface';
import { ActivosFijosService } from '@dashboard/pages/contabilidad/services/activos-fijos.service';
import { ActivoFijo } from '@dashboard/pages/contabilidad/interfaces/activos-fijos.interface';

import { CurrencyFormatDirective } from '@shared/directives/currency-format.directive';

@Component({
    selector: 'app-documento-soporte-forms-page',
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
        ProductosServiciosFormsComponent,
        PreviewAsientoComponent,
        CurrencyFormatDirective,
    ],
    providers: [
        DecimalPipe
    ],
    templateUrl: './documento-soporte-forms-page.component.html',
})
export class DocumentoSoporteFormsPageComponent implements OnInit {

    headTitle: HeaderInput = {
        title: 'Nuevo Documento Soporte',
        slog: 'Registra un documento soporte a proveedores'
    };

    private fb = inject(FormBuilder);
    notificationService = inject(NotificationService);
    documentoService = inject(DocumentosSoporteService);
    loaderService = inject(LoaderService);
    proveedoresServicios = inject(ProveedoresService);
    productoServicios = inject(ProductosService);
    cuentasService = inject(CuentasContablesService);
    router = inject(Router);
    activatedRoute = inject(ActivatedRoute);
    catalogsStore = inject(CatalogsStore);
    cuentasBancariasService = inject(CuentasBancariasService);
    activosFijosService = inject(ActivosFijosService);

    // Modal State
    isProviderModalVisible = signal<boolean>(false);
    isProductModalVisible = signal<boolean>(false);

    documentoId = toSignal(
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
    cuentasContables = signal<GetCuentasContables[]>([]);
    cuentasBancarias = signal<CuentaBancaria[]>([]);
    activosFijosList = signal<any[]>([]);
    refreshAsientoTrigger = signal<number>(0);
    documento = signal<DocumentoSoporte | null>(null);
    notasResumen = signal<FacturaNotasResumen | null>(null);
    anticiposDisponibles = signal<any[]>([]);
    anticiposAsociados = signal<{ anticipoId: string; numero: string; montoOriginal: number; saldoDisponible: number; montoAplicado: number }[]>([]);

    // Computed signals for filtering articles
    productosCreados = computed(() => {
        return this.productosList().filter(art => {
            const catCode = art.categoriaArticulo?.codigo || '';
            return catCode !== 'activos-fijos';
        });
    });

    activosFijosCreados = computed(() => {
        return this.activosFijosList();
    });

    formCompra = this.fb.group({
        proveedor: ['', Validators.required],
        proveedorSearch: [''],
        numeroIdentificacion: [''],
        tipoIdentificacion: [''],
        email: [''],
        telefono: [''],
        tipo: ['estandar', Validators.required],
        fechaEmision: [new Date().toISOString().substring(0, 10), Validators.required],
        fechaVencimiento: [''],
        formaPago: ['', Validators.required],
        metodoPago: [''],
        cuentaBancariaId: [''],
        referencia: ['', Validators.required],
        observaciones: ['', Validators.maxLength(500)],
        generationMode: ['1', Validators.required],
        periodStartDate: [''],
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
        tipoConcepto: ['PRODUCTO', Validators.required],
        producto: [null as GetProductosDetalle | ActivoFijo | null, Validators.required],
        cuentaContable: [null as any],
        quantity: [1, [Validators.required, Validators.min(0.00001)]],
        descripcion: [''],
        unitPrice: [0, [Validators.required, Validators.min(0.00001)]],
        iva: ['' as any],
        discount: [0, [Validators.min(0), Validators.max(100)]],
        total: [0]
    });

    ngOnInit(): void {
        this.setupPaymentLogic();
        this.activatedRoute.params.subscribe((params) => {
            const id = params['id'];
            if (id && id !== 'new') {
                this.headTitle.title = 'Editar documento soporte';
                this.headTitle.slog = 'Se edita documento soporte del sistema';
                this.loadFactura(id);
            } else {
                this.documento.set(null);
            }
        });

        this.getProveedoresAndProductos();
        this.getCuentasBancarias();

        // React to concept type changes
        this.productosItemsForm.get('tipoConcepto')?.valueChanges.subscribe((tipo) => {
            const prodCtrl = this.productosItemsForm.get('producto');
            const cuentaCtrl = this.productosItemsForm.get('cuentaContable');

            if (tipo === 'PRODUCTO' || tipo === 'ACTIVO_FIJO') {
                prodCtrl?.setValidators([Validators.required]);
                cuentaCtrl?.clearValidators();
            } else {
                cuentaCtrl?.setValidators([Validators.required]);
                prodCtrl?.clearValidators();
            }
            prodCtrl?.setValue(null);
            cuentaCtrl?.setValue(null);
            prodCtrl?.updateValueAndValidity();
            cuentaCtrl?.updateValueAndValidity();

            this.productosItemsForm.patchValue({
                unitPrice: 0,
                iva: '',
                quantity: 1,
                discount: 0,
                descripcion: '',
                total: 0
            }, { emitEvent: false });
            this.calculateItemTotal();
        });

        // React to product selection to auto-fill price and tax
        this.productosItemsForm.get('producto')?.valueChanges.subscribe((prod) => {
            const tipo = this.productosItemsForm.get('tipoConcepto')?.value;
            if (prod) {
                if (tipo === 'PRODUCTO') {
                    const p = prod as GetProductosDetalle;
                    this.productosItemsForm.patchValue({
                        unitPrice: p.precio,
                        iva: p.impuestoId,
                        quantity: 1,
                        discount: 0,
                        descripcion: p.observacion || ''
                    }, { emitEvent: false });
                } else if (tipo === 'ACTIVO_FIJO') {
                    const asset = prod as ActivoFijo;
                    this.productosItemsForm.patchValue({
                        unitPrice: asset.valorAdquisicion || 0,
                        iva: '',
                        quantity: 1,
                        discount: 0,
                        descripcion: asset.descripcion || ''
                    }, { emitEvent: false });
                }
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
            proveedores: this.proveedoresServicios.getProveedores({ limit: 1000, offset: 0 }),
            productos: this.productoServicios.getProductos({ limit: 1000, offset: 0 }),
            cuentas: this.cuentasService.getCuentasContables(),
            activosFijos: this.activosFijosService.getActivosFijos()
        }).subscribe({
            next: ({ proveedores, productos, cuentas, activosFijos }) => {
                const mappedProveedores = (proveedores.proveedores || []).map((p: any) => ({
                    ...p,
                    fullName: p.razonSocial?.trim() || `${p.nombre || ''} ${p.apellido || ''}`.trim()
                }));
                this.proveedoresList.set(mappedProveedores);
                this.productosList.set(productos.articulos);
                this.cuentasContables.set(cuentas.filter(c => c.aceptaMovimiento && c.isActive));
                this.activosFijosList.set(activosFijos?.items || activosFijos?.data?.items || (Array.isArray(activosFijos) ? activosFijos : []));
            },
            error: (error) => {
                this.notificationService.error('Error al cargar los datos de el documento soporte', error);
            },
            complete: () => {
                this.loaderService.hide();
            }
        });
    }

    loadFactura(id: string) {
        this.loaderService.show();
        this.documentoService.getDocumentoSoporteById(id).subscribe({
            next: (docRes) => {
                if (docRes.success) {
                    const invoice = docRes.data.data[0]!;
                    this.documento.set(invoice);
                    this.notasResumen.set(invoice.notasResumen ?? null);
                    if (!invoice.notasResumen) {
                        this.documentoService.getNotasResumen(id).subscribe({
                            next: r => this.notasResumen.set(r.data ?? null),
                            error: () => this.notasResumen.set(null),
                        });
                    }

                    while (this.items.length > 0) {
                        this.items.removeAt(0);
                    }

                    invoice.items.forEach((item: ItemDocumentoSoporte | any) => {
                        let tipoConceptoVal = 'PRODUCTO';
                        let nombreDisplay = item.articulo?.nombre || '';
                        let prodId = item.articuloId || null;
                        let cuentaId = item.cuentaContableId || null;

                        if (item.cuentaContableId || item.cuentaContable) {
                            const accountId = item.cuentaContableId || item.cuentaContable?.id;
                            const asset = this.activosFijosList().find(a => a.cuentaActivoId === accountId);
                            if (asset) {
                                tipoConceptoVal = 'ACTIVO_FIJO';
                                nombreDisplay = `Activo: ${asset.codigo} · ${asset.nombre}`;
                                prodId = asset.id;
                            } else {
                                tipoConceptoVal = 'CUENTA';
                                const cuenta = item.cuentaContable || item.cuenta;
                                nombreDisplay = cuenta ? `${cuenta.codigo} · ${cuenta.nombre}` : '';
                            }
                        } else {
                            const isAsset = item.articulo?.categoriaArticulo?.codigo === 'activos-fijos';
                            if (isAsset) {
                                tipoConceptoVal = 'ACTIVO_FIJO';
                            }
                        }

                        const newItem = this.fb.group({
                            tipoConcepto: [tipoConceptoVal],
                            productoId: [prodId],
                            cuentaContableId: [cuentaId],
                            productoNombre: [nombreDisplay],
                            cantidad: [item.quantity],
                            precioUnitario: [item.unitPrice],
                            iva: [item.porcentajeIva],
                            impuestoId: [item.impuestoId || ''],
                            descuento: [item.descuento],
                            subtotal: [item.valorSubtotal],
                            total: [item.itemTotal],
                            descripcion: [item.descripcion || '']
                        });
                        this.items.push(newItem);
                    });

                    const prov = invoice.proveedor;
                    const providerName = prov ? (prov.razonSocial?.trim() || `${prov.nombre || ''} ${prov.apellido || ''}`.trim()) : '';
                    const abrev = prov?.tipoDocumentoRel?.abreviatura || '';
                    const ident = prov ? (abrev ? `${abrev} - ${prov.identificacion}` : prov.identificacion) : '';

                    this.formCompra.patchValue({
                        proveedorSearch: providerName,
                        proveedor: invoice.proveedorId,
                        numeroIdentificacion: ident,
                        email: prov?.email,
                        telefono: prov?.telefono,
                        tipo: invoice.tipo || 'estandar',
                        fechaEmision: invoice.fecha,
                        fechaVencimiento: invoice.fechaVencimiento,
                        formaPago: invoice.formaPago,
                        metodoPago: invoice.metodoPago, // Assuming it exists in backend
                        cuentaBancariaId: invoice.cuentaBancariaId,
                        referencia: invoice.numeroFacturaProveedor,
                        observaciones: invoice.observaciones,
                        generationMode: invoice.generationMode || '1',
                        periodStartDate: invoice.periodStartDate || '',
                    });
                    this.totales.facturaTotal = invoice.total;
                    this.totales.subtotal = invoice.subtotal;
                    this.totales.totalIVA = invoice.iva;
                    this.totales.descuentoTotal = invoice.descuento;

                    // Cargar anticipos cruzados/aplicados a este documento
                    this.documentoService.getAplicacionesAnticipo(id).subscribe({
                        next: (appRes) => {
                            const apps = appRes.data || [];
                            this.anticiposAsociados.set(apps.map((app: any) => ({
                                anticipoId: app.anticipoId,
                                numero: app.anticipo?.numero || '',
                                montoOriginal: app.anticipo?.montoOriginal || 0,
                                saldoDisponible: app.anticipo?.saldoDisponible || 0,
                                montoAplicado: app.montoAplicado
                            })));

                            // Cargar también todos los disponibles para el proveedor
                            if (invoice.proveedorId) {
                                this.cargarAnticiposDisponibles(invoice.proveedorId);
                            }
                            this.loaderService.hide();
                        },
                        error: (err) => {
                            if (invoice.proveedorId) {
                                this.cargarAnticiposDisponibles(invoice.proveedorId);
                            }
                            this.loaderService.hide();
                        }
                    });
                }
            },
            error: (error) => {
                this.notificationService.error('Error al cargar los datos de el documento soporte', error);
                this.loaderService.hide();
            }

        });
    }

    getIvaTarifa(ivaValue: any): number {
        if (!ivaValue) return 0;
        if (typeof ivaValue === 'number') return ivaValue;
        const impuesto = this.catalogsStore.impuestos().find(i => i.id == ivaValue);
        const tarifa = impuesto?.tarifa ? parseInt(impuesto.tarifa) : 0;

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
        const qty = itemVal.quantity || 0;
        const price = itemVal.unitPrice || 0;
        if (qty <= 0 || price <= 0) {
            this.notificationService.warning('La cantidad y el precio unitario deben ser mayores a 0.');
            return;
        }
        const subtotal = (itemVal.quantity || 0) * (itemVal.unitPrice || 0);
        const tarifa = this.getIvaTarifa(itemVal.iva);

        let nombreDisplay = '';
        let productoIdVal: string | null = null;
        let cuentaContableIdVal: string | null = null;

        if (itemVal.tipoConcepto === 'PRODUCTO') {
            const prod = itemVal.producto as GetProductosDetalle;
            nombreDisplay = prod?.nombre || '';
            productoIdVal = prod?.id || null;
        } else if (itemVal.tipoConcepto === 'ACTIVO_FIJO') {
            const asset = itemVal.producto as ActivoFijo;
            nombreDisplay = asset ? `Activo: ${asset.codigo} · ${asset.nombre}` : '';
            cuentaContableIdVal = asset?.cuentaActivoId || null;
        } else if (itemVal.tipoConcepto === 'CUENTA') {
            nombreDisplay = itemVal.cuentaContable ? `${itemVal.cuentaContable.codigo} · ${itemVal.cuentaContable.nombre}` : '';
            cuentaContableIdVal = itemVal.cuentaContable?.id || null;
        }

        const newItem = this.fb.group({
            tipoConcepto: [itemVal.tipoConcepto],
            productoId: [productoIdVal],
            cuentaContableId: [cuentaContableIdVal],
            productoNombre: [nombreDisplay],
            cantidad: [itemVal.quantity],
            precioUnitario: [itemVal.unitPrice],
            iva: [tarifa],
            impuestoId: [itemVal.iva],
            descuento: [itemVal.discount],
            subtotal: [subtotal],
            total: [itemVal.total],
            descripcion: [itemVal.descripcion || '']
        });

        this.items.push(newItem);

        const currentTipo = itemVal.tipoConcepto;
        this.productosItemsForm.reset({
            tipoConcepto: currentTipo,
            producto: null,
            cuentaContable: null,
            quantity: 1,
            unitPrice: 0,
            iva: '',
            discount: 0,
            descripcion: '',
            total: 0
        });

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

        if (!this.validarPeriodo()) return;

        const esElectronico = this.formCompra.controls.tipo.value === 'electronico';
        // El electrónico nunca se registra directo: se crea en borrador y se emite a la DIAN.
        const crearComoBorrador = isDraft || esElectronico;

        this.loading.set(true);
        this.loaderService.show(esElectronico && !isDraft ? 'Emitiendo a la DIAN...' : 'Guardando documento soporte...');
        const factura = this.formCompra.value;
        const items = this.formCompra.controls.items.value;

        const invoiceData: any = {
            isDraft: crearComoBorrador,
            tipo: factura.tipo || 'estandar',
            proveedorId: factura.proveedor!,
            fecha: factura.fechaEmision!,
            numeroFacturaProveedor: factura.referencia || '',
            observaciones: factura.observaciones || '',
            fechaVencimiento: factura.fechaVencimiento || '',
            formaPago: factura.formaPago!,
            metodoPago: factura.metodoPago || '',
            cuentaBancariaId: factura.cuentaBancariaId || '',
            generationMode: factura.generationMode || '1',
            periodStartDate: factura.periodStartDate || '',
            items: items.map((item: any) => ({
                articuloId: item.productoId,
                cuentaContableId: item.cuentaContableId,
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
            anticiposAsociados: this.anticiposAsociados().map(a => ({
                anticipoId: a.anticipoId,
                montoAplicado: a.montoAplicado
            }))
        };

        if (this.documentoId() == 'new') {
            this.documentoService.createDocumentoSoporte(invoiceData).subscribe((response) => {
                if (response.success == false) {
                    this.loading.set(false);
                    this.loaderService.hide();
                    this.notificationService.error(
                        `Ocurrio un problema al crear el documento ${HelpersUtils.getMessageError(response.message)}`,
                        'Error',
                        5000
                    );
                    return;
                }

                if (esElectronico && !isDraft) {
                    const createdId = response.data?.id || (response as any).id;
                    this.emitirDocumento(createdId);
                    return;
                }

                this.loading.set(false);
                this.notificationService.success('Documento creado con éxito', 'Accion Completada', 5000);
                avisarAdvertenciasInventario(this.notificationService, response.data);


                setTimeout(() => {
                    this.loaderService.hide();
                    if (isDraft) {
                        const invoiceId = response.data?.id || (response as any).id;
                        if (invoiceId) {
                            this.router.navigate(['/panel/compras/documentos-soporte', invoiceId]);
                        } else {
                            this.router.navigateByUrl('/panel/compras/documentos-soporte');
                        }
                    } else {
                        this.router.navigateByUrl('/panel/compras/documentos-soporte');
                    }
                }, 200);
            });

        } else {
            this.updateDocumento(this.documentoId()!, invoiceData, isDraft);
        }

    }

    /** Emite un documento electrónico en borrador a la DIAN. */
    emitirDocumento(id: string): void {
        if (!id) {
            this.loading.set(false);
            this.loaderService.hide();
            return;
        }
        this.loaderService.show('Emitiendo a la DIAN...');
        this.documentoService.emitirDocumentoSoporte(id).subscribe((res) => {
            this.loading.set(false);
            this.loaderService.hide();
            if (res.success == false) {
                this.notificationService.error(
                    `El documento se guardó pero la DIAN lo rechazó: ${HelpersUtils.getMessageError(res.message)}`,
                    'Advertencia',
                    8000
                );
                this.router.navigate(['/panel/compras/documentos-soporte', id]);
                return;
            }
            this.notificationService.success('Documento emitido a la DIAN con éxito', 'Acción Completada', 5000);
            avisarAdvertenciasInventario(this.notificationService, res.data);
            this.router.navigateByUrl('/panel/compras/documentos-soporte');
        });
    }

    /** Valida el periodo DIAN (modo acumulado semanal exige fecha dentro de los últimos 6 días). */
    validarPeriodo(): boolean {
        const mode = this.formCompra.controls.generationMode.value || '1';
        if (mode !== '2') return true;
        const raw = this.formCompra.controls.periodStartDate.value;
        if (!raw) {
            this.notificationService.error('El modo acumulado semanal requiere la fecha de adquisición.', 'Campos no validos', 5000);
            return false;
        }
        const start = new Date(raw + 'T00:00:00');
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const diffDias = Math.floor((hoy.getTime() - start.getTime()) / 86400000);
        if (Number.isNaN(start.getTime()) || diffDias < 0 || diffDias > 6) {
            this.notificationService.error('La fecha de adquisición debe estar entre hoy y los 6 días anteriores.', 'Campos no validos', 5000);
            return false;
        }
        return true;
    }

    updateDocumento(id: string, data: Partial<DocumentoSoporte>, isDraft: boolean) {
        this.documentoService.updateDocumentoSoporte(id, data).subscribe((response) => {
            if (response.success == false) {
                this.loading.set(false);
                this.loaderService.hide();
                this.notificationService.error(
                    `Ocurrio un problema al actualizar el documento ${HelpersUtils.getMessageError(response.message)}`,
                    'Error',
                    5000
                );
                return;
            }

            if (isDraft) {
                this.loading.set(false);
                this.notificationService.success(
                    'Borrador actualizado con éxito',
                    'Acción Completada',
                    5000
                );
                setTimeout(() => {
                    this.loaderService.hide();
                    this.refreshAsientoTrigger.update(v => v + 1);
                }, 200);
            } else if (data.tipo === 'electronico') {
                this.emitirDocumento(id);
            } else {
                this.loaderService.show('Registrando documento soporte...');
                this.documentoService.registrarDocumentoSoporte(id).subscribe((regRes) => {
                    this.loading.set(false);
                    this.loaderService.hide();
                    if (regRes.success == false) {
                        this.notificationService.error(
                            `El documento se guardó pero ocurrió un problema al registrarlo: ${HelpersUtils.getMessageError(regRes.message)}`,
                            'Advertencia',
                            5000
                        );
                        return;
                    }
                    this.notificationService.success(
                        'Documento registrado con éxito',
                        'Acción Completada',
                        5000
                    );
                    avisarAdvertenciasInventario(this.notificationService, regRes.data);
                    this.router.navigateByUrl('/panel/compras/documentos-soporte');
                });
            }
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
        const fullName = newProvider.razonSocial?.trim() || `${newProvider.nombre || ''} ${newProvider.apellido || ''}`.trim();
        const providerWithFullName = {
            ...newProvider,
            fullName
        };

        this.proveedoresList.update(list => {
            if (list.some(p => p.id === newProvider.id)) {
                return list;
            }
            return [...list, providerWithFullName];
        });

        const nombreDisplay = fullName;
        const abreviatura = newProvider.tipoDocumentoRel?.abreviatura || '';

        this.formCompra.patchValue({
            proveedor: newProvider.id,
            proveedorSearch: nombreDisplay,
            numeroIdentificacion: abreviatura ? `${abreviatura} - ${newProvider.identificacion}` : newProvider.identificacion,
            tipoIdentificacion: abreviatura,
            telefono: newProvider.telefono,
            email: newProvider.email,
        });

        // Resetear asociados anteriores al cambiar de proveedor
        this.anticiposAsociados.set([]);

        if (newProvider.id) {
            this.cargarAnticiposDisponibles(newProvider.id);
        }

        this.closeProviderModal();
    }

    cargarAnticiposDisponibles(proveedorId: string) {
        this.documentoService.getAnticiposDisponibles(proveedorId).subscribe({
            next: (res) => {
                const asociadosIds = this.anticiposAsociados().map(a => a.anticipoId);
                const disponibles = (res.data || []).filter((a: any) => !asociadosIds.includes(a.id));
                this.anticiposDisponibles.set(disponibles);
            },
            error: (err) => {
                this.notificationService.error('Error al cargar anticipos del proveedor', err);
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

