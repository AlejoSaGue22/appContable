import { Component, inject, OnInit, signal, effect, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';

import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { FormErrorLabelComponent } from "src/app/utils/components/form-error-label/form-error-label.component";
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';
import { ListGroupDropdownComponent } from "@shared/components/list-group-dropdown/list-group-dropdown.component";
import { FacturaCompraService } from '../../services/factura-compra.service';
import { ComprasNotasAjusteService } from '../../services/compras-notas-ajuste.service';
import { CatalogsStore } from '@dashboard/services/catalogs.store';
import { NotaAjusteCompraItem } from '../../../../interfaces/notas-ajuste-compra-interface';
import { FacturaCompra } from '../../../../interfaces/factura-compra-interface';
import { FormaPago } from '@dashboard/interfaces/documento-venta-interface'; // Assuming FormaPago is shared or similar

@Component({
  selector: 'app-notas-ajuste-compras-form-page',
  standalone: true,
  imports: [
    HeaderTitlePageComponent, 
    ReactiveFormsModule, 
    FormErrorLabelComponent, 
    RouterLink, 
    CurrencyPipe,
    ListGroupDropdownComponent
  ],
  templateUrl: './notas-ajuste-form-page.component.html',
})
export class NotasAjusteComprasFormPageComponent implements OnInit {

  headTitle = computed(() => {
    const id = this.notaId() != 'new-Item';
    return {
      title: id ? 'Editar Nota de Crédito (Compras)' : 'Nueva Nota de Crédito (Compras)',
      slog: id ? 'Edita una nota crédito vinculada a una factura de compra' : 'Registra una nota crédito vinculada a una factura de compra'
    };
  });

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notasService = inject(ComprasNotasAjusteService);
  private facturasService = inject(FacturaCompraService);
  private notificationService = inject(NotificationService);
  private loaderService = inject(LoaderService);
  public catalogsStore = inject(CatalogsStore);

  notaId = toSignal(this.route.params.pipe(map(p => p['id'])));
  facturaIdFromQuery = toSignal(this.route.queryParams.pipe(map(p => p['facturaId'])));
  
  tipoNota = signal<'credito'>('credito');
  isDraft = signal<boolean>(false);
  
  facturasDisponibles = signal<FacturaCompra[]>([]);
  itemsSeleccionados = signal<NotaAjusteCompraItem[]>([]);
  facturaSeleccionada = signal<FacturaCompra | null>(null);

  // Computed signals for payment logic
  facturaEsCredito = computed(() => this.facturaSeleccionada()?.formaPago === FormaPago.CREDITO);
  facturaConAbonos = computed(() => (this.facturaSeleccionada()?.totalPagado ?? 0) > 0);
  
  formaPagoBloqueada = computed(() => {
    const factura = this.facturaSeleccionada();
    if (!factura) return false;
    
    // Crédito sin abonos: bloqueada a CREDITO
    if (factura.formaPago === FormaPago.CREDITO && (factura.totalPagado ?? 0) === 0) return true;
    
    // Contado: bloqueada a CONTADO
    if (factura.formaPago === FormaPago.CONTADO) return true;
    
    return false;
  });

  form = this.fb.group({
    facturaOriginalId: ['', Validators.required],
    facturaSearch: [''],
    tipo: ['credito', Validators.required],
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
    this.loadFacturas();

    const id = this.notaId();
    if (id && id !== 'new-Item') {
      this.loadNota(id);
    } else {
      const fId = this.facturaIdFromQuery();
      if (fId) {
        this.onFacturaSeleccionadaById(fId);
      }
      this.loaderService.hide();
    }
  }

  loadFacturas() {
    this.facturasService.getFacturasCompras({ limit: 100, page: 1 }).subscribe(res => {
      if (res && res.data) {
        this.facturasDisponibles.set(res.data as any);
      }
    });
  }

  loadNota(id: string) {
      this.notasService.getNotaAjusteById(id).subscribe({
        next: (res) => {
            try {
            const nota = res.data;
            this.form.patchValue({
              facturaSearch: nota.facturaOriginalNumero,
              facturaOriginalId: nota.facturaOriginalId,
              tipo: nota.tipo,
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
              return {
                articuloId: item.articuloId,
                descripcion: item.articulo?.nombre || '',
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
            const factura = nota.facturaOriginal;
            this.facturaSeleccionada.set(factura as any);
            this.loaderService.hide();
            } catch (error) {
              console.log('Error al cargar la nota de ajuste de compra 2', error);
              this.loaderService.hide();
              this.notificationService.error('Error al cargar la nota de ajuste de compra', 'Error');
            }
        },
        error: (error) => {
          console.log('Error al cargar la nota de ajuste de compra 1', error);
          this.loaderService.hide();
          this.notificationService.error(error.error?.message || 'Error al cargar la nota de ajuste', 'Error');
        }
      });
  }

  onFacturaSeleccionada(factura: any) {
    const f = factura;
    this.facturaSeleccionada.set(f);
    this.isDraft.set(false);
    
    this.form.patchValue({
      facturaOriginalId: f.id,
      facturaSearch: f.numeroFacturaProveedor || f.numero,
      formaPago: f.formaPago,
      metodoPago: f.formaPago === FormaPago.CONTADO ? f.metodoPago : '',
      esReembolsoAbono: false
    });
    
    // Auto-load items from invoice
    const items: NotaAjusteCompraItem[] = f.items.map((item: any) => {
      const gross = item.quantity * item.unitPrice;
      const discountVal = gross * ((item.descuento || 0) / 100);
      const afterDiscount = gross - discountVal;
      const ivaVal = afterDiscount * (item.porcentajeIva / 100);

      return {
        descripcion: item.articulo.nombre,
        articuloId: item.articuloId,
        impuestoId: item.impuestoId || undefined,
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

  onFacturaSeleccionadaById(id: string) {
    this.facturasService.getFacturaCompraById(id).subscribe(res => {
      if (res.success && res.data) {
        this.onFacturaSeleccionada(res.data);
      }
    });
  }

  removeItem(index: number) {
    this.itemsSeleccionados.update(items => items.filter((_, i) => i !== index));
  }

  updateItemField(index: number, field: keyof NotaAjusteCompraItem, value: any) {
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

    this.loaderService.show();
    const data = {
      isDraft: isDraft,
      tipo: this.tipoNota(),
      facturaOriginalId: this.form.value.facturaOriginalId,
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
    const saldoPendiente = this.facturaSeleccionada()?.saldoPendiente ?? 0;
    if (data.total > saldoPendiente && data.formaPago === FormaPago.CREDITO) {
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
      : this.notasService.createNotaCredito(data);

    request.subscribe({
      next: (res) => {
        this.loaderService.hide();
        if (res.success) {
          this.notificationService.success('Nota guardada con éxito', 'Completado');
          this.router.navigate(['/panel/compras/notas-ajuste']);
        } else {
          const message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
          this.notificationService.error(message || 'Error al guardar la nota', 'Error');
        }
      },
      error: () => this.loaderService.hide()
    });
  }
}
