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
import { ProductosServiciosFormsComponent } from '@dashboard/pages/ventas/productos-servicios/productos-servicios-forms/productos-servicios-forms.component';
import { forkJoin } from 'rxjs';
import { ProveedoresService } from '../../services/proveedores.service';
import { ProductosService } from '@dashboard/pages/ventas/services/productos.service';
import { ProveedoresInterface } from '@dashboard/interfaces/proveedores-interface';
import { GetProductosDetalle } from '@dashboard/interfaces/productos-interface';

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
        ProductosServiciosFormsComponent
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
    loaderService = inject(LoaderService);
    proveedoresServicios = inject(ProveedoresService);
    productoServicios = inject(ProductosService);
    router = inject(Router);
    activatedRoute = inject(ActivatedRoute);

    // Modal State
    isProviderModalVisible = signal<boolean>(false);
    isProductModalVisible = signal<boolean>(false);

    totales = {
        subtotal: 0,
        descuentoTotal: 0,
        totalIVA: 0,
        retenciones: 0,
        facturaTotal: 0
    };

    // Mock Data Signals
    proveedoresList = signal<ProveedoresInterface[]>([]);
    productosList = signal<GetProductosDetalle[]>([]);

    formCompra = this.fb.group({
        proveedor: ['', Validators.required],
        proveedorSearch: [''],
        nit: [''],
        email: [''],
        telefono: [''],
        fechaEmision: [new Date().toISOString().substring(0, 10), Validators.required],
        fechaVencimiento: [new Date().toISOString().substring(0, 10), Validators.required],
        metodoPago: ['Contado', Validators.required],
        referencia: [''],
        observaciones: [''],
        items: this.fb.array([])
    });

    // Signal for loading state
    loading = signal<boolean>(false);

    // Form for adding new items
    productosItemsForm = this.fb.group({
        producto: [{ id: '', nombre: '' }, Validators.required],
        quantity: [1, [Validators.required, Validators.min(1)]],
        unitPrice: [0, [Validators.required, Validators.min(0)]],
        iva: [0, [Validators.min(0), Validators.max(100)]],
        discount: [0, [Validators.min(0), Validators.max(100)]],
        total: [0]
    });

    ngOnInit(): void {
        const id = this.activatedRoute.snapshot.params['id'];
        if (id && id !== 'new-Item') {
            this.headTitle.title = 'Editar Factura de Compra';
            this.headTitle.slog = 'Se edita factura de compra del sistema';
            this.loadFactura(id);
        }

        this.getProveedoresAndProductos();

        // React to product selection to auto-fill price and tax
        this.productosItemsForm.get('producto')?.valueChanges.subscribe((prod: GetProductosDetalle | any) => {
            if (prod) {
                this.productosItemsForm.patchValue({
                    unitPrice: prod.precio,
                    iva: parseInt(prod.impuesto!),
                    quantity: 1,
                    discount: 0
                });
                this.calculateItemTotal();
            }
        });

        // React to changes in quantity, price, discount to update item total
        this.productosItemsForm.valueChanges.subscribe(() => {
            this.calculateItemTotal();
        });
    }

    getProveedoresAndProductos() {
        this.loaderService.show();
        forkJoin({
            proveedores: this.proveedoresServicios.getProveedores({ limit: 10000, offset: 0 }),
            productos: this.productoServicios.getProductos({ limit: 10000, offset: 0, venta_compra: 'compra' })
        }).subscribe({
            next: ({ proveedores, productos }) => {
                this.proveedoresList.set(proveedores.proveedores);
                this.productosList.set(productos.articulos);
                this.loaderService.hide();
            },
            error: (error) => {
                console.log("Error Comprobantes Compras: ", error);
                this.loaderService.hide();
            }
        });
    }

    loadFactura(id: string) {
        // Logic to load existing invoice would go here
        console.log('Loading invoice', id);
    }

    calculateItemTotal() {
        const val = this.productosItemsForm.value;
        const subtotal = (val.quantity || 0) * (val.unitPrice || 0);
        const discountAmount = subtotal * ((val.discount || 0) / 100);
        const taxAmount = (subtotal - discountAmount) * ((val.iva || 0) / 100);
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
        console.log(itemVal);
        const newItem = this.fb.group({
            productoId: [itemVal.producto?.id],
            productoNombre: [itemVal.producto?.nombre],
            cantidad: [itemVal.quantity],
            precioUnitario: [itemVal.unitPrice],
            iva: [itemVal.iva],
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
            const itemTax = (itemSubtotal - itemDesc) * (item.iva / 100);

            this.totales.subtotal += itemSubtotal;
            this.totales.descuentoTotal += itemDesc;
            this.totales.totalIVA += itemTax;
            this.totales.facturaTotal += item.total;
        });

    }

    // Computeds for Totals
    resumenTotales = computed(() => {
        console.log('this.formCompra.controls.items.value', this.formCompra.controls.items.value);
        console.log('Entro al computed');
        const items = this.formCompra.controls.items.value;
        let subtotal = 0;
        let impuestos = 0;
        let descuentos = 0;

        items.forEach((item: any) => {
            const itemSubtotal = item.cantidad * item.precioUnitario;
            const itemDesc = itemSubtotal * (item.descuento / 100);
            const itemTax = (itemSubtotal - itemDesc) * (item.iva / 100);

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


    onSubmit() {
        if (this.formCompra.invalid) {
            this.formCompra.markAllAsTouched();
            this.notificationService.error('Complete todos los campos requeridos', 'Error');
            return;
        }

        this.loading.set(true);

        // Simulate API Save
        setTimeout(() => {
            this.loading.set(false);
            this.notificationService.success(
                'Factura guardada correctamente',
                'Éxito'
            );

            setTimeout(() => {
                this.router.navigateByUrl('/panel/ventas/purchases')
            }, 1500);
        }, 1500);

    }

    // --- Modal Handling ---

    openProviderModal() {
        this.isProviderModalVisible.set(true);
    }

    closeProviderModal() {
        this.isProviderModalVisible.set(false);
    }

    onProviderSaved(newProvider: any) { // Replace any with proper type
        // Add new provider to list
        this.proveedoresList.update(list => [...list, newProvider]);

        console.log(newProvider);

        // Select the new provider in the form
        this.formCompra.patchValue({
            proveedor: newProvider.id,
            proveedorSearch: newProvider.nombre,
            nit: newProvider.identificacion,
            telefono: newProvider.telefono,
            email: newProvider.email,
        });

        this.closeProviderModal();
        this.notificationService.success('Proveedor creado y seleccionado', 'Listo');
    }


    openProductModal() {
        this.isProductModalVisible.set(true);
    }

    closeProductModal() {
        this.isProductModalVisible.set(false);
    }

    onProductSaved(newProduct: any) { // Replace any with proper type
        // Add new product to list
        this.productosList.update(list => [...list, newProduct]);

        // Select the new product in the item form
        this.productosItemsForm.patchValue({ producto: newProduct });

        this.closeProductModal();
        this.notificationService.success('Producto creado y seleccionado', 'Listo');
    }

}

