import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ProveedoresService } from '../../../compras/services/proveedores.service';
import { PagosHttpService } from '../../services/pagos.service';
import { CuentasContablesService } from '@dashboard/pages/contabilidad/services/cuentas-contables.service';
import { ImpuestosService } from '@dashboard/pages/administracion/configuraciones/pages/impuestos/services/impuestos.service';
import { ProveedoresInterface } from '@dashboard/interfaces/proveedores-interface';
import { CuentaBancaria } from '@dashboard/interfaces/pagos-interface';
import { GetCuentasContables } from '@dashboard/pages/contabilidad/interfaces/cuentas-contables.interface';
import { HeaderTitlePageComponent, HeaderInput } from '@dashboard/components/header-title-page/header-title-page.component';
import { ListGroupDropdownComponent } from '@shared/components/list-group-dropdown/list-group-dropdown.component';
import { CatalogsStore } from '@dashboard/services/catalogs.store';
import { NotificationService } from '@shared/services/notification.service';

@Component({
  selector: 'app-comprobante-egreso-forms-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    HeaderTitlePageComponent,
    ListGroupDropdownComponent
  ],
  templateUrl: './comprobante-egreso-forms-page.component.html',
  styleUrls: []
})
export class ComprobanteEgresoFormsPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);
  private proveedoresService = inject(ProveedoresService);
  private pagosService = inject(PagosHttpService);
  private cuentasService = inject(CuentasContablesService);
  private impuestosService = inject(ImpuestosService);
  public catalogsStore = inject(CatalogsStore);

  headTitle = signal<HeaderInput>({
    title: 'Nuevo Comprobante de Egreso',
    slog: 'Registrar egresos a facturas de proveedores o gastos por otros conceptos directos',
  });

  form!: FormGroup;
  modoEgreso = signal<'factura' | 'otros'>('factura');
  loading = signal(false);
  submitting = signal(false);

  // Catálogos
  proveedores = signal<any[]>([]);
  cuentasBancarias = signal<CuentaBancaria[]>([]);
  cuentasContables = signal<GetCuentasContables[]>([]);
  impuestos = signal<any[]>([]);

  // Search input value
  proveedorSearch = signal<string>('');

  // Facturas pendientes de pago para el proveedor seleccionado
  facturasPendientes = signal<any[]>([]);
  facturasLoading = signal(false);

  get mostrarBanco(): boolean {
    const metodoId = this.form?.get('metodoPagoId')?.value;
    const metodo = this.catalogsStore.paymentMethods().find(m => m.id == metodoId);
    return metodo ? metodo.codigo !== '10' : true;
  }

  ngOnInit(): void {
    this.initForm();
    this.cargarCatalogos();

    // Reaccionar al cambio de proveedor para cargar facturas
    this.form.get('terceroId')?.valueChanges.subscribe(proveedorId => {
      if (proveedorId && this.modoEgreso() === 'factura') {
        this.cargarFacturasPendientes(proveedorId);
      } else {
        this.facturasPendientes.set([]);
      }
    });

    // Reaccionar a cambios en medio de pago para requerir banco
    this.form.get('metodoPagoId')?.valueChanges.subscribe(metodoId => {
      const bancoCtrl = this.form.get('cuentaBancariaId');
      const metodo = this.catalogsStore.paymentMethods().find(m => m.id == metodoId);
      if (metodo && metodo.codigo === '10') {
        bancoCtrl?.clearValidators();
        bancoCtrl?.setValue('');
      } else {
        bancoCtrl?.setValidators([Validators.required]);
      }
      bancoCtrl?.updateValueAndValidity();
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      terceroId: ['', [Validators.required]],
      proveedorSearch: [''],
      fecha: [new Date().toISOString().substring(0, 10), [Validators.required]],
      metodoPagoId: ['', [Validators.required]],
      cuentaBancariaId: ['', [Validators.required]],
      referencia: [''],
      notas: [''],
      // Option 1: Detalles facturas
      detalles: this.fb.array([]),
      // Option 2: Detalles conceptos
      conceptos: this.fb.array([])
    });
  }

  get detallesFormArray(): FormArray {
    return this.form.get('detalles') as FormArray;
  }

  get conceptosFormArray(): FormArray {
    return this.form.get('conceptos') as FormArray;
  }

  onProveedorSeleccionado(proveedor: any): void {
    this.form.patchValue({
      terceroId: proveedor.id,
      proveedorSearch: proveedor.nombreDisplay
    });
    this.proveedorSearch.set(proveedor.nombreDisplay);
  }

  cambiarModo(modo: 'factura' | 'otros'): void {
    this.modoEgreso.set(modo);
    // Limpiar arrays
    while (this.detallesFormArray.length) this.detallesFormArray.removeAt(0);
    while (this.conceptosFormArray.length) this.conceptosFormArray.removeAt(0);

    const proveedorCtrl = this.form.get('terceroId');
    if (modo === 'otros') {
      proveedorCtrl?.clearValidators(); // Opcional para otros egresos
      this.agregarConceptoLinea();
    } else {
      proveedorCtrl?.setValidators([Validators.required]);
      const proveedorId = proveedorCtrl?.value;
      if (proveedorId) {
        this.cargarFacturasPendientes(proveedorId);
      }
    }
    proveedorCtrl?.updateValueAndValidity();
  }

  cargarCatalogos(): void {
    this.loading.set(true);
    this.proveedoresService.getProveedores({ limit: 100, offset: 0 }).subscribe((res: any) => {
      const mapped = (res.proveedores || []).map((p: any) => {
        const name = p.razonSocial?.trim() ? p.razonSocial : `${p.nombre || ''} ${p.apellido || ''}`.trim();
        return {
          ...p,
          nombreDisplay: name
        };
      });
      this.proveedores.set(mapped);
    });

    // 2. Cuentas Bancarias
    this.pagosService.getCuentasBancarias().subscribe((res: any) => {
      this.cuentasBancarias.set(res);
      if (res.length > 0) {
        this.form.get('cuentaBancariaId')?.setValue(res[0].id);
      }
    });

    // 3. Cuentas Contables (filtrar auxiliares que aceptan movimiento)
    this.cuentasService.getCuentasContables().subscribe((res: any) => {
      this.cuentasContables.set(res.filter((c: any) => c.aceptaMovimiento && c.isActive));
    });

    // 4. Impuestos
    this.impuestosService.getAll(1, 100).subscribe((res: any) => {
      this.impuestos.set(res.data || []);
    });

    this.loading.set(false);
  }

  cargarFacturasPendientes(proveedorId: string): void {
    this.facturasLoading.set(true);
    while (this.detallesFormArray.length) this.detallesFormArray.removeAt(0);

    this.pagosService.getFacturasPendientesProveedor(proveedorId).subscribe({
      next: (facts: any[]) => {
        this.facturasPendientes.set(facts);
        // Crear un control por cada factura
        facts.forEach((f: any) => {
          this.detallesFormArray.push(this.fb.group({
            facturaId: [f.id],
            comprobante: [f.numero],
            total: [f.total],
            saldoPendiente: [f.saldoPendiente],
            monto: [0],
            seleccionada: [false]
          }));
        });
        this.facturasLoading.set(false);
      },
      error: () => this.facturasLoading.set(false)
    });
  }

  // Métodos para Option 1: Pago a facturas
  toggleFacturaSeleccion(index: number): void {
    const group = this.detallesFormArray.at(index);
    const seleccionada = group.get('seleccionada')?.value;
    const montoCtrl = group.get('monto');
    const saldo = group.get('saldoPendiente')?.value;

    if (seleccionada) {
      montoCtrl?.setValue(saldo);
    } else {
      montoCtrl?.setValue(0);
    }
  }

  sumarTotalAbonos(): number {
    let sum = 0;
    this.detallesFormArray.controls.forEach(c => {
      if (c.get('seleccionada')?.value) {
        sum += Number(c.get('monto')?.value || 0);
      }
    });
    return sum;
  }

  // Métodos para Option 2: Otros Conceptos
  agregarConceptoLinea(): void {
    const group = this.fb.group({
      cuentaContableId: ['', [Validators.required]],
      concepto: ['', [Validators.required]],
      cantidad: [1, [Validators.required, Validators.min(1)]],
      valorUnitario: [0, [Validators.required, Validators.min(0)]],
      impuestoId: [''],
      impuestoPorcentaje: [0],
      total: [{ value: 0, disabled: true }]
    });

    // Escuchar cambios para recalcular total de línea
    group.valueChanges.subscribe(() => {
      this.calcularLineaTotal(group);
    });

    this.conceptosFormArray.push(group);
  }

  eliminarConceptoLinea(index: number): void {
    if (this.conceptosFormArray.length > 1) {
      this.conceptosFormArray.removeAt(index);
    }
  }

  getCuentaContableDisplay(index: number): string {
    const group = this.conceptosFormArray.at(index);
    const id = group.get('cuentaContableId')?.value;
    if (!id) return '';
    const account = this.cuentasContables().find((c) => c.id === id);
    return account ? `${account.codigo} - ${account.nombre}` : '';
  }

  onCuentaSelect(account: any, index: number): void {
    const group = this.conceptosFormArray.at(index);
    group.patchValue({ cuentaContableId: account.id });
  }

  onImpuestoCambio(index: number): void {
    const group = this.conceptosFormArray.at(index);
    const impId = group.get('impuestoId')?.value;
    if (impId) {
      const imp = this.impuestos().find(i => i.id === impId);
      group.get('impuestoPorcentaje')?.setValue(imp ? Number(imp.tarifa) : 0);
    } else {
      group.get('impuestoPorcentaje')?.setValue(0);
    }
  }

  calcularLineaTotal(group: FormGroup): void {
    const cant = Number(group.get('cantidad')?.value || 0);
    const valor = Number(group.get('valorUnitario')?.value || 0);
    const porc = Number(group.get('impuestoPorcentaje')?.value || 0);

    const base = cant * valor;
    const iva = base * (porc / 100);
    const total = base + iva;

    group.get('total')?.setValue(total, { emitEvent: false });
  }

  sumarTotalOtros(): number {
    let sum = 0;
    this.conceptosFormArray.controls.forEach(c => {
      const totalVal = c.get('total')?.value || 0;
      sum += Number(totalVal);
    });
    return sum;
  }

  get totalGeneral(): number {
    return this.modoEgreso() === 'factura' ? this.sumarTotalAbonos() : this.sumarTotalOtros();
  }

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const formVal = this.form.getRawValue();
    const metodo = this.catalogsStore.paymentMethods().find(m => m.id == formVal.metodoPagoId);
    const isCaja = metodo?.codigo === '10';

    if (this.modoEgreso() === 'factura') {
      const itemsAbonar = formVal.detalles.filter((d: any) => d.seleccionada && d.monto > 0);
      if (itemsAbonar.length === 0) {
        this.notificationService.error('Debe seleccionar al menos una factura y especificar un monto mayor a cero para abonar.', 'Campos Requeridos');
        this.submitting.set(false);
        return;
      }

      const payload = {
        terceroId: formVal.terceroId,
        fecha: formVal.fecha,
        metodoPagoId: Number(formVal.metodoPagoId),
        cuentaBancariaId: isCaja ? null : formVal.cuentaBancariaId,
        referencia: formVal.referencia,
        notas: formVal.notas,
        detalles: itemsAbonar.map((item: any) => ({
          facturaId: item.facturaId,
          monto: Number(item.monto)
        }))
      };

      this.pagosService.registrarPagoMultiple(payload).subscribe({
        next: () => {
          this.submitting.set(false);
          this.router.navigate(['/panel/pagos/cxp']);
        },
        error: (err: any) => {
          this.submitting.set(false);
          this.notificationService.error('Ocurrió un error al registrar el comprobante de egreso.', 'Error');
        }
      });

    } else {
      // Otros conceptos egresos (gastos directos)
      if (formVal.conceptos.length === 0) {
        this.notificationService.error('Debe agregar al menos una línea de concepto.', 'Campos Requeridos');
        this.submitting.set(false);
        return;
      }

      const payload = {
        terceroId: formVal.terceroId || null,
        fecha: formVal.fecha,
        metodoPagoId: Number(formVal.metodoPagoId),
        cuentaBancariaId: isCaja ? null : formVal.cuentaBancariaId,
        referencia: formVal.referencia,
        notas: formVal.notas,
        conceptos: formVal.conceptos.map((c: any) => ({
          cuentaContableId: c.cuentaContableId,
          concepto: c.concepto,
          cantidad: Number(c.cantidad),
          valorUnitario: Number(c.valorUnitario),
          impuestoId: c.impuestoId || null,
          impuestoPorcentaje: Number(c.impuestoPorcentaje || 0)
        }))
      };

      this.pagosService.registrarOtrosEgresos(payload).subscribe({
        next: () => {
          this.submitting.set(false);
          this.router.navigate(['/panel/pagos/cxp']);
        },
        error: (err: any) => {
          this.submitting.set(false);
          this.notificationService.error('Ocurrió un error al registrar otros egresos.', 'Error');
        }
      });
    }
  }
}
