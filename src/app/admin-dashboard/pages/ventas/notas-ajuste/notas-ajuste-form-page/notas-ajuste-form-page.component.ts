import { Component, inject, OnInit, signal, effect, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, map, of, switchMap } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrencyPipe } from '@angular/common';

import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { FormErrorLabelComponent } from "src/app/utils/components/form-error-label/form-error-label.component";
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';
import { ListGroupDropdownComponent } from "@shared/components/list-group-dropdown/list-group-dropdown.component";
import { ComprobantesVentasService } from '../../services/comprobantes-ventas.service';
import { NotasAjusteService } from '../../services/notas-ajuste.service';
import { ConceptosNotaCredito, ConceptosNotaDebito, NotaAjusteItem, NotaAjuste } from "../../../../interfaces/notas-ajuste-interface";
import { GetFacturaRequest } from '@dashboard/interfaces/documento-venta-interface';

@Component({
  selector: 'app-notas-ajuste-form-page',
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
export class NotasAjusteFormPageComponent implements OnInit {

  headTitle: HeaderInput = {
    title: 'Nueva Nota de Ajuste',
    slog: 'Registra una nota crédito o débito vinculada a una factura'
  };

  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private notasService = inject(NotasAjusteService);
  private ventasService = inject(ComprobantesVentasService);
  private notificationService = inject(NotificationService);
  private loaderService = inject(LoaderService);

  notaId = toSignal(this.route.params.pipe(map(p => p['id'])));
  facturaIdFromQuery = toSignal(this.route.queryParams.pipe(map(p => p['facturaId'])));
  
  tipoNota = signal<'CREDITO' | 'DEBITO'>('CREDITO');
  conceptos = computed(() => this.tipoNota() === 'CREDITO' ? ConceptosNotaCredito : ConceptosNotaDebito);
  
  facturasDisponibles = signal<GetFacturaRequest[]>([]);
  itemsSeleccionados = signal<NotaAjusteItem[]>([]);
  facturaSeleccionada = signal<GetFacturaRequest | null>(null);

  form = this.fb.group({
    facturaOriginalId: ['', Validators.required],
    facturaSearch: [''],
    tipo: ['CREDITO', Validators.required],
    concepto: ['', Validators.required],
    motivo: ['', [Validators.required, Validators.maxLength(1000)]],
    fecha: [new Date().toISOString().split('T')[0], Validators.required],
    fechaVencimiento: [''],
    observaciones: [''],
  });

  totales = computed(() => {
    const items = this.itemsSeleccionados();
    const subtotal = items.reduce((acc, item) => acc + (item.cantidad * item.valorUnitario), 0);
    const iva = items.reduce((acc, item) => acc + (item.cantidad * item.valorUnitario * (item.porcentajeIVA / 100)), 0);
    return {
      subtotal,
      iva,
      total: subtotal + iva
    };
  });

  ngOnInit(): void {
    this.loaderService.show();
    this.loadFacturas();

    const id = this.notaId();
    if (id && id !== 'new') {
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
    this.ventasService.getComprobanteVentas({ limit: 100, page: 1, status: 'accepted' }).subscribe(res => {
      this.facturasDisponibles.set(res.data);
    });
  }

  loadNota(id: string) {
    this.notasService.getNotaAjusteById(id).subscribe({
      next: (res) => {
        const nota = res.data[0];
        this.form.patchValue({
          facturaOriginalId: nota.facturaOriginalId,
          tipo: nota.tipo,
          concepto: nota.concepto,
          motivo: nota.motivo,
          fecha: nota.fecha,
          fechaVencimiento: nota.fechaVencimiento,
          observaciones: nota.observaciones
        });
        this.tipoNota.set(nota.tipo as any);
        this.itemsSeleccionados.set(nota.items);
        this.facturaSeleccionada.set(nota.facturaOriginal || null);
        this.loaderService.hide();
      },
      error: () => this.loaderService.hide()
    });
  }

  onFacturaSeleccionada(factura: any) {
    const f = factura as GetFacturaRequest;
    this.facturaSeleccionada.set(f);
    this.form.patchValue({
      facturaOriginalId: f.id,
      facturaSearch: f.comprobante_completo
    });
    
    // Auto-load items from invoice
    const items: NotaAjusteItem[] = f.items.map(item => ({
      descripcion: item.description,
      cantidad: item.quantity,
      valorUnitario: item.unitPrice,
      porcentajeIVA: item.iva,
      subtotal: item.subtotal,
      total: item.total
    }));
    this.itemsSeleccionados.set(items);
  }

  onFacturaSeleccionadaById(id: string) {
    this.ventasService.getInvoiceById(id).subscribe(res => {
      if (res.data && res.data[0]) {
        this.onFacturaSeleccionada(res.data[0]);
      }
    });
  }

  removeItem(index: number) {
    this.itemsSeleccionados.update(items => items.filter((_, i) => i !== index));
  }

  updateItemQuantity(index: number, quantity: number) {
    this.itemsSeleccionados.update(items => {
      const newItems = [...items];
      newItems[index] = { ...newItems[index], cantidad: quantity };
      return newItems;
    });
  }

  onSubmit() {
    if (this.form.invalid || this.itemsSeleccionados().length === 0) {
      this.form.markAllAsTouched();
      this.notificationService.error('Por favor completa todos los campos y agrega al menos un item.', 'Formulario inválido');
      return;
    }

    this.loaderService.show();
    const data = {
      ...this.form.value,
      items: this.itemsSeleccionados(),
      tipo: this.tipoNota()
    };

    const id = this.notaId();
    const request = (id && id !== 'new') 
      ? this.notasService.updateNotaAjuste(id, data)
      : (this.tipoNota() === 'CREDITO' ? this.notasService.createNotaCredito(data) : this.notasService.createNotaDebito(data));

    request.subscribe({
      next: (res) => {
        this.loaderService.hide();
        if (res.success) {
          this.notificationService.success('Nota guardada con éxito', 'Completado');
          this.router.navigate(['/panel/ventas/notas-ajuste']);
        } else {
          const message = Array.isArray(res.message) ? res.message.join(', ') : res.message;
          this.notificationService.error(message || 'Error al guardar la nota', 'Error');
        }
      },
      error: () => this.loaderService.hide()
    });
  }
}
