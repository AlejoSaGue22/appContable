import { Component, inject, OnInit, signal, effect, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';

import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { FormErrorLabelComponent } from "src/app/utils/components/form-error-label/form-error-label.component";
import { NotificationService } from '@shared/services/notification.service';
import { avisarAdvertenciasInventario } from '@dashboard/services/inventario.service';
import { LoaderService } from '@utils/services/loader.service';
import { ListGroupDropdownComponent } from "@shared/components/list-group-dropdown/list-group-dropdown.component";
import { DocumentosSoporteService } from '../../services/documentos-soporte.service';
import { NotasAjusteSoporteService } from '../../services/notas-ajuste-soporte.service';
import { CatalogsStore } from '@dashboard/services/catalogs.store';
import { NotaAjusteSoporteItem } from '../../../../interfaces/notas-ajuste-soporte-interface';
import { DocumentoSoporte } from '../../../../interfaces/documento-soporte-interface';
import { ConceptosNotaCredito, ConceptosNotaDebito } from '../../../../interfaces/notas-ajuste-interface';
import { FormaPago } from '@dashboard/interfaces/documento-venta-interface'; // Assuming FormaPago is shared or similar

@Component({
    selector: 'app-notas-ajuste-soporte-form-page',
    standalone: true,
    imports: [
        HeaderTitlePageComponent,
        ReactiveFormsModule,
        FormErrorLabelComponent,
        RouterLink,
        CurrencyPipe,
        ListGroupDropdownComponent
    ],
    templateUrl: './notas-ajuste-soporte-form-page.component.html',
})
export class NotasAjusteSoporteFormPageComponent implements OnInit {

    headTitle = computed(() => {
        const id = this.notaId() != 'new-Item';
        const tipoLabel = this.tipoNota() === 'debito' ? 'Débito' : 'Crédito';
        return {
            title: id ? `Editar Nota de ${tipoLabel} (Soporte)` : `Nueva Nota de ${tipoLabel} (Soporte)`,
            slog: id ? 'Edita una nota vinculada a un documento soporte' : 'Registra una nota vinculada a un documento soporte'
        };
    });

    private fb = inject(FormBuilder);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private notasService = inject(NotasAjusteSoporteService);
    private facturasService = inject(DocumentosSoporteService);
    private notificationService = inject(NotificationService);
    private loaderService = inject(LoaderService);
    public catalogsStore = inject(CatalogsStore);

    notaId = toSignal(this.route.params.pipe(map(p => p['id'])));
    documentoIdFromQuery = toSignal(this.route.queryParams.pipe(map(p => p['documentoId'])));

    tipoNota = signal<'credito' | 'debito'>('credito');
    isDraft = signal<boolean>(false);

    /** El DSE origen es electrónico: la nota exige concepto de corrección DIAN. */
    documentoEsElectronico = computed(() => this.documentoSeleccionado()?.tipo === 'electronico');

    conceptosDisponibles = computed(() =>
        this.tipoNota() === 'debito' ? ConceptosNotaDebito : ConceptosNotaCredito);

    documentosDisponibles = signal<DocumentoSoporte[]>([]);
    itemsSeleccionados = signal<NotaAjusteSoporteItem[]>([]);
    documentoSeleccionado = signal<DocumentoSoporte | null>(null);

    // Computed signals for payment logic
    documentoEsCredito = computed(() => this.documentoSeleccionado()?.formaPago === FormaPago.CREDITO);
    documentoConAbonos = computed(() => (this.documentoSeleccionado()?.totalPagado ?? 0) > 0);

    formaPagoBloqueada = computed(() => {
        const factura = this.documentoSeleccionado();
        if (!factura) return false;

        // Crédito sin abonos: bloqueada a CREDITO
        if (factura.formaPago === FormaPago.CREDITO && (factura.totalPagado ?? 0) === 0) return true;

        // Contado: bloqueada a CONTADO
        if (factura.formaPago === FormaPago.CONTADO) return true;

        return false;
    });

    form = this.fb.group({
        documentoOriginalId: ['', Validators.required],
        documentoSearch: [''],
        tipo: ['credito', Validators.required],
        conceptoCorreccion: [''],
        formaPago: ['', Validators.required],
        metodoPago: [''],
        esReembolsoAbono: [false],
        motivo: ['', [Validators.required, Validators.maxLength(1000)]],
        fecha: [new Date().toISOString().split('T')[0], Validators.required],
        fechaVencimiento: [''],
        observaciones: [''],
    });

    // Watchers for reactive logic
    paymentLogic = effect(() => {
        const formaPago = this.form.get('formaPago')?.value;
        const metodoPagoControl = this.form.get('metodoPago');

        if (formaPago === FormaPago.CONTADO) {
            metodoPagoControl?.setValidators([Validators.required]);
        } else {
            metodoPagoControl?.clearValidators();
            // Opcional: limpiar si no es contado
            if (formaPago === FormaPago.CREDITO) metodoPagoControl?.setValue('');
        }
        metodoPagoControl?.updateValueAndValidity();
    });

    totales = computed(() => {
        const items = this.itemsSeleccionados();
        let subtotal = 0;
        let totalDescuento = 0;
        let totalIVA = 0;

        items.forEach(item => {
            const gross = item.cantidad * item.valorUnitario;
            const discount = gross * ((item.descuento || 0) / 100);
            const afterDiscount = gross - discount;
            const iva = afterDiscount * (item.porcentajeIVA / 100);

            subtotal += gross;
            totalDescuento += discount;
            totalIVA += iva;
        });

        return {
            subtotal,
            descuento: totalDescuento,
            iva: totalIVA,
            total: subtotal - totalDescuento + totalIVA
        };
    });

    ngOnInit(): void {
        this.loaderService.show();
        this.loadDocumentos();

        const id = this.notaId();
        if (id && id !== 'new-Item') {
            this.loadNota(id);
        } else {
            const fId = this.documentoIdFromQuery();
            if (fId) {
                this.onDocumentoSeleccionadoById(fId);
            }
            this.loaderService.hide();
        }
    }

    loadDocumentos() {
        this.facturasService.getDocumentosSoporte({ limit: 100, page: 1 }).subscribe(res => {
            if (res && res.data) {
                this.documentosDisponibles.set((res.data as any[]).filter((d: any) => d.estado === 'registrado'));
            }
        });
    }

    loadNota(id: string) {
        this.notasService.getNotaAjusteById(id).subscribe({
            next: (res) => {
                try {
                    const nota = res.data;
                    this.form.patchValue({
                        documentoSearch: nota.documentoOriginalNumero,
                        documentoOriginalId: nota.documentoOriginalId,
                        tipo: nota.tipo,
                        conceptoCorreccion: (nota as any).conceptoCorreccion || '',
                        formaPago: nota.formaPago,
                        metodoPago: nota.metodoPago?.toString(),
                        esReembolsoAbono: nota.esReembolsoAbono,
                        motivo: nota.motivo,
                        fecha: nota.fecha,
                        fechaVencimiento: nota.fechaVencimiento,
                        observaciones: nota.observaciones
                    });
                    this.tipoNota.set(nota.tipo);
                    const mappedItems = nota.items.map(item => {
                        const cantidad = item.cantidad;
                        const valorUnitario = item.valorUnitario;
                        const gross = cantidad * valorUnitario;
                        const discountVal = gross * ((item.descuento || 0) / 100);
                        const afterDiscount = gross - discountVal;
                        const ivaVal = afterDiscount * (item.porcentajeIVA / 100);
                        const cuenta = (item as any).cuentaContable;
                        return {
                            articuloId: item.articuloId ?? null,
                            cuentaContableId: (item as any).cuentaContableId ?? cuenta?.id ?? null,
                            descripcion: item.descripcion
                                || (item as any).articulo?.nombre
                                || (cuenta ? `${cuenta.codigo} - ${cuenta.nombre}` : '')
                                || '',
                            descuento: item.descuento,
                            impuestoId: item.impuestoId,
                            subtotal: gross,
                            total: afterDiscount + ivaVal,
                            cantidad: item.cantidad,
                            valorUnitario: item.valorUnitario,
                            porcentajeIVA: item.porcentajeIVA,
                        };
                    });
                    this.itemsSeleccionados.set(mappedItems);
                    const documento = nota.documentoOriginal;
                    this.documentoSeleccionado.set(documento as any);
                    this.loaderService.hide();
                } catch (error) {
                    console.log('Error al cargar la nota de ajuste a soporte 2', error);
                    this.loaderService.hide();
                    this.notificationService.error('Error al cargar la nota de ajuste a soporte', 'Error');
                }
            },
            error: (error) => {
                console.log('Error al cargar la nota de ajuste a soporte 1', error);
                this.loaderService.hide();
                this.notificationService.error(error.error?.message || 'Error al cargar la nota de ajuste', 'Error');
            }
        });
    }

    onDocumentoSeleccionado(factura: any) {
        const f = factura;
        this.documentoSeleccionado.set(f);
        this.isDraft.set(false);

        this.form.patchValue({
            documentoOriginalId: f.id,
            documentoSearch: f.numeroFacturaProveedor || f.numero,
            formaPago: f.formaPago,
            metodoPago: f.formaPago === FormaPago.CONTADO ? f.metodoPago : '',
            esReembolsoAbono: false
        });

        // Auto-load items from invoice (soporta gasto directo a cuenta contable: articulo null)
        const items: NotaAjusteSoporteItem[] = (f.items ?? []).map((item: any) => {
            const gross = item.quantity * item.unitPrice;
            const discountVal = gross * ((item.descuento || 0) / 100);
            const afterDiscount = gross - discountVal;
            const ivaVal = afterDiscount * (item.porcentajeIva / 100);

            return {
                descripcion: item.descripcion
                    || item.articulo?.nombre
                    || (item.cuentaContable ? `${item.cuentaContable.codigo} - ${item.cuentaContable.nombre}` : '')
                    || '',
                articuloId: item.articuloId ?? null,
                cuentaContableId: item.cuentaContableId ?? item.cuentaContable?.id ?? null,
                impuestoId: item.impuestoId || item.impuestoRel?.id || undefined,
                cantidad: item.quantity,
                valorUnitario: item.unitPrice,
                porcentajeIVA: item.porcentajeIva,
                descuento: item.descuento || 0,
                subtotal: gross,
                total: afterDiscount + ivaVal
            };
        });
        this.itemsSeleccionados.set(items);
    }

    onDocumentoSeleccionadoById(id: string) {
        this.facturasService.getDocumentoSoporteById(id).subscribe(res => {
            const doc = (res as any).data?.data?.[0] ?? (res as any).data;
            if (res.success && doc) {
                this.onDocumentoSeleccionado(doc);
            }
        });
    }

    removeItem(index: number) {
        this.itemsSeleccionados.update(items => items.filter((_, i) => i !== index));
    }

    updateItemField(index: number, field: keyof NotaAjusteSoporteItem, value: any) {
        this.itemsSeleccionados.update(items => {
            const newItems = [...items];
            newItems[index] = {
                ...newItems[index],
                [field]: (field === 'descripcion') ? value : Number(value)
            };

            // Recalculate subtotal and total for the row item if needed
            const item = newItems[index];
            const gross = item.cantidad * item.valorUnitario;
            const discount = gross * ((item.descuento || 0) / 100);
            const afterDiscount = gross - discount;
            const iva = afterDiscount * (item.porcentajeIVA / 100);

            newItems[index].subtotal = gross;
            newItems[index].total = afterDiscount + iva;

            return newItems;
        });
    }

    updateItemQuantity(index: number, quantity: number) {
        this.updateItemField(index, 'cantidad', quantity);
    }

    onImpuestoChange(index: number, impuestoId: string) {
        const impuesto = this.catalogsStore.impuestos().find(i => i.id === impuestoId);
        if (impuesto) {
            this.itemsSeleccionados.update(items => {
                const newItems = [...items];
                newItems[index] = {
                    ...newItems[index],
                    impuestoId: impuesto.id,
                    porcentajeIVA: impuesto?.tarifa ? parseInt(impuesto.tarifa) : 0,
                };
                const item = newItems[index];
                const gross = item.cantidad * item.valorUnitario;
                const discount = gross * ((item.descuento || 0) / 100);
                const afterDiscount = gross - discount;
                const iva = afterDiscount * (item.porcentajeIVA / 100);
                newItems[index].subtotal = gross;
                newItems[index].total = afterDiscount + iva;
                return newItems;
            });
        }
    }

    onSubmit(isDraft: boolean) {
        if (this.form.invalid || this.itemsSeleccionados().length === 0) {
            this.form.markAllAsTouched();
            this.notificationService.error('Por favor completa todos los campos y agrega al menos un item.', 'Formulario inválido');
            return;
        }

        // La nota a un DSE electrónico exige concepto de corrección DIAN.
        if (this.documentoEsElectronico() && !this.form.value.conceptoCorreccion) {
            this.form.markAllAsTouched();
            this.notificationService.error('Selecciona el concepto de corrección DIAN para el documento electrónico.', 'Formulario inválido');
            return;
        }

        this.loaderService.show();
        const data = {
            isDraft: isDraft,
            tipo: this.tipoNota(),
            documentoOriginalId: this.form.value.documentoOriginalId,
            conceptoCorreccion: this.form.value.conceptoCorreccion || undefined,
            formaPago: this.form.value.formaPago,
            metodoPago: this.form.value.metodoPago,
            esReembolsoAbono: this.form.value.esReembolsoAbono,
            motivo: this.form.value.motivo,
            fecha: this.form.value.fecha,
            fechaVencimiento: this.form.value.fechaVencimiento,
            items: this.itemsSeleccionados(),
            observaciones: this.form.value.observaciones,
            subtotal: this.totales().subtotal,
            descuento: this.totales().descuento,
            iva: this.totales().iva,
            total: this.totales().total
        };

        // Validación de Saldo (Impedir envío si excede el saldo pendiente)
        const saldoPendiente = this.documentoSeleccionado()?.saldoPendiente ?? 0;
        if (this.tipoNota() === 'credito' && data.total > saldoPendiente && data.formaPago === FormaPago.CREDITO) {
            this.notificationService.error(
                `El valor de la nota (${this.totales().total}) no puede ser mayor al saldo pendiente (${saldoPendiente}) para ajustes de cartera.`,
                'Error de Validación'
            );
            this.loaderService.hide();
            return;
        }

        const id = this.notaId();
        const request = (id && id !== 'new-Item')
            ? this.notasService.updateNotaAjuste(id, data)
            : (this.tipoNota() === 'debito'
                ? this.notasService.createNotaDebito(data)
                : this.notasService.createNotaCredito(data));

        request.subscribe({
            next: (res) => {
                this.loaderService.hide();
                if (res.success) {
                    this.notificationService.success('Nota guardada con éxito', 'Completado');
                    avisarAdvertenciasInventario(this.notificationService, res.data);
                    this.router.navigate(['/panel/compras/notas-ajuste-soporte']);
                } else {
                    const message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
                    this.notificationService.error(message || 'Error al guardar la nota', 'Error');
                }
            },
            error: () => this.loaderService.hide()
        });
    }

    onTipoChange(tipo: string): void {
        this.tipoNota.set(tipo as 'credito' | 'debito');
        this.form.patchValue({ tipo }, { emitEvent: false });
    }
}
