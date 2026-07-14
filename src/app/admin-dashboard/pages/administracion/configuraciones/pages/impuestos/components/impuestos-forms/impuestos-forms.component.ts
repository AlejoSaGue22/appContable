import { Component, inject, signal, input, output, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ImpuestosService } from '../../services/impuestos.service';
import { CuentasContablesService } from '@dashboard/pages/contabilidad/services/cuentas-contables.service';
import { NotificationService } from '@shared/services/notification.service';
import { firstValueFrom, of } from 'rxjs';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs/operators';
import { Impuesto } from '../../interfaces/impuesto.interface';

@Component({
  selector: 'app-impuestos-forms',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './impuestos-forms.component.html',
})
export class ImpuestosFormsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private impuestosService = inject(ImpuestosService);
  private cuentasService = inject(CuentasContablesService);
  private notificationService = inject(NotificationService);

  impuestoId = input<string | null>(null);
  isModal = input<boolean>(false);
  saveSuccess = output<any>();
  cancel = output<void>();

  showAdvanced = signal<boolean>(false);
  cuentas = signal<any[]>([]);
  cuentasFiltradas = computed(() => {
    return this.cuentas().filter(
      (c) =>
        c.aceptaMovimiento
    );
  });

  taxForm: FormGroup = this.fb.group({
    nombre: ['', [Validators.required]],
    tipo: ['IVA', [Validators.required]],
    tarifa: [0, [Validators.required, Validators.min(0)]],
    descripcion: [''],
    activo: [true],
    cuentaVentasId: [null],
    cuentaComprasId: [null],
    cuentaDevVentasId: [null],
    cuentaDevComprasId: [null],
  });

  ngOnInit() {
    this.loadCuentas();
  }

  async loadCuentas() {
    try {
      const data = await firstValueFrom(
        this.cuentasService.getCuentasContables(),
      );
      this.cuentas.set(data);
    } catch (error) {
      console.error('Error loading accounts', error);
    }
  }

  impuestoResource = rxResource({
    request: () => {
      return { id: this.impuestoId() };
    },
    loader: ({ request }) => {
      if (!request.id) {
        this.taxForm.reset({
          activo: true,
          tipo: 'IVA',
          tarifa: 0,
        });
        return of(null);
      }
      return this.impuestosService.getById(request.id).pipe(
        tap((data: Impuesto) => {
          this.taxForm.patchValue({
            ...data,
            tarifa: parseInt(data.tarifa as any),
            cuentaVentasId: data.cuentaVentasId || data.cuentaVentas?.id || null,
            cuentaComprasId: data.cuentaComprasId || data.cuentaCompras?.id || null,
            cuentaDevVentasId: data.cuentaDevVentasId || data.cuentaDevVentas?.id || null,
            cuentaDevComprasId: data.cuentaDevComprasId || data.cuentaDevCompras?.id || null,
          });
        })
      );
    }
  });

  toggleAdvanced() {
    this.showAdvanced.update((v) => !v);
  }

  onCancel() {
    this.cancel.emit();
  }

  async save() {
    if (this.taxForm.invalid) return;

    const data = this.taxForm.value;
    try {
      if (this.impuestoId()) {
        const response = await firstValueFrom(
          this.impuestosService.update(this.impuestoId()!, data),
        );
        this.notificationService.success(response.message, 'Éxito');
        this.saveSuccess.emit(response);
      } else {
        const response = await firstValueFrom(
          this.impuestosService.create(data),
        );
        this.notificationService.success(response.message, 'Éxito');
        this.saveSuccess.emit(response);
      }
    } catch (error: any) {
      this.notificationService.error(
        error?.error?.message || 'Error al guardar el impuesto',
        'Error',
      );
    }
  }
}
