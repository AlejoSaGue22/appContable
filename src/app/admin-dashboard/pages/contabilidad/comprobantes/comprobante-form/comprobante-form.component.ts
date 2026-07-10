import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { ComprobantesService } from '../../services/comprobantes.service';
import { TipoComprobanteService } from '../../../administracion/configuraciones/pages/tipo-comprobantes/services/tipo-comprobante.service';
import { CuentasContablesService } from '@dashboard/pages/contabilidad/services/cuentas-contables.service';
import { ClientesService } from '../../../ventas/services/clientes.service';
import { ProveedoresService } from '../../../compras/services/proveedores.service';
import { CentrosCostosService } from '../../../administracion/configuraciones/pages/centros-costos/services/centros-costos.service';
import { HeaderTitlePageComponent, HeaderInput } from '@dashboard/components/header-title-page/header-title-page.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { NotificationService } from '@shared/services/notification.service';
import { EstadoComprobante } from '../../interfaces/comprobantes.interface';

@Component({
  selector: 'app-comprobante-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    HeaderTitlePageComponent,
    BreadcrumbComponent,
  ],
  templateUrl: './comprobante-form.component.html',
})
export class ComprobanteFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(NotificationService);

  private service = inject(ComprobantesService);
  private tipoService = inject(TipoComprobanteService);
  private cuentasService = inject(CuentasContablesService);
  private clientesService = inject(ClientesService);
  private proveedoresService = inject(ProveedoresService);
  private centrosCostosService = inject(CentrosCostosService);

  public headTitle = signal<HeaderInput>({
    title: 'Nuevo Comprobante Contable',
    slog: 'Registra un movimiento contable manual balanceando débitos y créditos',
  });

  public isEditing = signal(false);
  public id = signal<string | null>(null);
  public loading = signal(false);
  public submitting = signal(false);

  public form!: FormGroup;
  public estado = signal<EstadoComprobante>(EstadoComprobante.BORRADOR);
  public consecutivo = signal<string>('Borrador');

  // Catálogos
  public tiposComprobantes = signal<any[]>([]);
  public cuentasContables = signal<any[]>([]);
  public clientes = signal<any[]>([]);
  public proveedores = signal<any[]>([]);
  public centrosCostos = signal<any[]>([]);

  breadcrumbItems = [
    { label: 'Contabilidad', route: '/panel/contabilidad' },
    { label: 'Comprobantes', route: '/panel/contabilidad/comprobantes' },
    { label: 'Formulario' },
  ];

  ngOnInit(): void {
    this.initForm();
    this.cargarCatalogos();

    const paramId = this.route.snapshot.paramMap.get('id');
    if (paramId) {
      this.isEditing.set(true);
      this.id.set(paramId);
      this.cargarComprobante(paramId);
    } else {
      this.agregarLinea();
      this.agregarLinea(); // Inicializar con 2 líneas vacías
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      tipoComprobanteId: ['', [Validators.required]],
      fechaDocumento: [new Date().toISOString().substring(0, 10), [Validators.required]],
      observaciones: [''],
      detalles: this.fb.array([]),
    });

    // Recalcular balance al cambiar líneas
    this.form.get('detalles')?.valueChanges.subscribe(() => {
      this.validarYBalancear();
    });
  }

  get detallesFormArray(): FormArray {
    return this.form.get('detalles') as FormArray;
  }

  private cargarCatalogos(): void {
    this.tipoService.loadTipos().subscribe((tipos) => {
      this.tiposComprobantes.set(tipos.filter((t) => t.activo));
    });

    this.cuentasService.getCuentasContables().subscribe((res: any) => {
      // Filtrar cuentas de movimiento activas
      this.cuentasContables.set(res.filter((c: any) => c.aceptaMovimiento && c.isActive));
    });

    this.clientesService.getClientes({ limit: 200, offset: 0 }).subscribe((res: any) => {
      this.clientes.set(
        (res.clientes || []).map((c: any) => ({
          id: c.id,
          nombreDisplay: c.razonSocial?.trim() ? c.razonSocial : `${c.nombre || ''} ${c.apellido || ''}`.trim(),
        })),
      );
    });

    this.proveedoresService.getProveedores({ limit: 200, offset: 0 }).subscribe((res: any) => {
      this.proveedores.set(
        (res.proveedores || []).map((p: any) => ({
          id: p.id,
          nombreDisplay: p.razonSocial?.trim() ? p.razonSocial : `${p.nombre || ''} ${p.apellido || ''}`.trim(),
        })),
      );
    });

    this.centrosCostosService.loadCentrosCostos().subscribe((res) => {
      this.centrosCostos.set(res.filter((cc) => cc.activo));
    });
  }

  private cargarComprobante(id: string): void {
    this.loading.set(true);
    this.service.findOne(id).subscribe({
      next: (comp) => {
        this.estado.set(comp.estado);
        this.consecutivo.set(comp.numero);
        this.headTitle.set({
          title: `Comprobante ${comp.numero}`,
          slog: `Estado: ${comp.estado} | Creado por: ${comp.creadoPor?.fullName || ''}`,
        });

        this.form.patchValue({
          tipoComprobanteId: comp.tipoComprobanteId,
          fechaDocumento: comp.fechaDocumento.substring(0, 10),
          observaciones: comp.observaciones || '',
        });

        // Cargar detalles
        while (this.detallesFormArray.length) {
          this.detallesFormArray.removeAt(0);
        }

        comp.detalles.forEach((det) => {
          this.agregarLinea(det);
        });

        if (comp.estado !== EstadoComprobante.BORRADOR) {
          this.form.disable();
        }

        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Error al cargar el comprobante contable.');
        this.router.navigate(['/panel/contabilidad/comprobantes']);
        this.loading.set(false);
      },
    });
  }

  agregarLinea(data?: any): void {
    const group = this.fb.group({
      cuentaContableId: [data?.cuentaContableId || '', [Validators.required]],
      descripcion: [data?.descripcion || ''],
      debito: [Number(data?.debito || 0), [Validators.required, Validators.min(0)]],
      credito: [Number(data?.credito || 0), [Validators.required, Validators.min(0)]],
      clienteId: [data?.clienteId || ''],
      proveedorId: [data?.proveedorId || ''],
      centroCostoId: [data?.centroCostoId || ''],
      documentoReferencia: [data?.documentoReferencia || ''],
    });

    this.detallesFormArray.push(group);
  }

  eliminarLinea(index: number): void {
    if (this.detallesFormArray.length > 2) {
      this.detallesFormArray.removeAt(index);
    } else {
      this.toastService.error('Un comprobante debe tener al menos 2 movimientos.');
    }
  }

  onCuentaCambio(index: number): void {
    const group = this.detallesFormArray.at(index);
    const cuentaId = group.get('cuentaContableId')?.value;
    const cuenta = this.cuentasContables().find((c) => c.id === cuentaId);

    // Si la cuenta requiere tercero y no se ha especificado, limpiar para forzar ingreso
    if (cuenta) {
      // Si la cuenta es de gastos (5) o costos (6) y no tiene centro de costo, podríamos advertir
      if (!cuenta.requiereTercero) {
        group.get('clienteId')?.setValue('');
        group.get('proveedorId')?.setValue('');
      }
      if (!cuenta.requiereCentroCostos && !cuenta.codigo.startsWith('5') && !cuenta.codigo.startsWith('6')) {
        group.get('centroCostoId')?.setValue('');
      }
    }
  }

  requiereTercero(index: number): boolean {
    const group = this.detallesFormArray.at(index);
    const cuentaId = group.get('cuentaContableId')?.value;
    const cuenta = this.cuentasContables().find((c) => c.id === cuentaId);
    return cuenta ? cuenta.requiereTercero : false;
  }

  requiereCentro(index: number): boolean {
    const group = this.detallesFormArray.at(index);
    const cuentaId = group.get('cuentaContableId')?.value;
    const cuenta = this.cuentasContables().find((c) => c.id === cuentaId);
    if (!cuenta) return false;
    return cuenta.requiereCentroCostos || cuenta.codigo.startsWith('5') || cuenta.codigo.startsWith('6');
  }

  requiereRefDoc(): boolean {
    const tipoId = this.form.get('tipoComprobanteId')?.value;
    const tipo = this.tiposComprobantes().find((t) => t.id === tipoId);
    return tipo ? tipo.docReferenciaObligatorio : false;
  }

  // Totales dinámicos calculados mediante getters
  get totalDebitos(): number {
    return this.detallesFormArray.controls.reduce(
      (sum, ctrl) => sum + Number(ctrl.get('debito')?.value || 0),
      0,
    );
  }

  get totalCreditos(): number {
    return this.detallesFormArray.controls.reduce(
      (sum, ctrl) => sum + Number(ctrl.get('credito')?.value || 0),
      0,
    );
  }

  get diferencia(): number {
    return Math.abs(this.totalDebitos - this.totalCreditos);
  }

  get estaBalanceado(): boolean {
    return this.diferencia <= 0.01;
  }

  private validarYBalancear(): void {
    // Lógica adicional para actualizaciones si fuesen requeridas
  }

  cuadrarAsiento(index: number): void {
    const group = this.detallesFormArray.at(index);
    const dif = this.totalDebitos - this.totalCreditos;
    
    // Si débito es mayor, necesitamos agregar un crédito para balancear
    if (dif > 0) {
      const currentCredito = Number(group.get('credito')?.value || 0);
      group.get('credito')?.setValue(currentCredito + dif);
      group.get('debito')?.setValue(0);
    } else if (dif < 0) {
      // Si crédito es mayor, necesitamos agregar un débito para balancear
      const currentDebito = Number(group.get('debito')?.value || 0);
      group.get('debito')?.setValue(currentDebito + Math.abs(dif));
      group.get('credito')?.setValue(0);
    }
  }

  guardarBorrador(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.error('Por favor complete los campos requeridos marcados en rojo.');
      return;
    }

    if (!this.estaBalanceado) {
      this.toastService.error(
        `El comprobante contable está descuadrado por $${this.diferencia.toLocaleString('es-CO')}. Débitos y Créditos deben sumar igual.`
      );
      return;
    }

    this.submitting.set(true);
    const payload = this.form.getRawValue();

    // Limpiar campos null/vacíos
    payload.detalles = payload.detalles.map((d: any) => ({
      ...d,
      clienteId: d.clienteId || null,
      proveedorId: d.proveedorId || null,
      centroCostoId: d.centroCostoId || null,
    }));

    if (this.isEditing() && this.id()) {
      this.service.update(this.id()!, payload).subscribe({
        next: (res) => {
          this.toastService.success('Borrador de comprobante actualizado con éxito.');
          this.submitting.set(false);
          this.router.navigate(['/panel/contabilidad/comprobantes']);
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Error al guardar el borrador del comprobante.');
          this.submitting.set(false);
        },
      });
    } else {
      this.service.create(payload).subscribe({
        next: (res) => {
          this.toastService.success(`Comprobante ${res.numero} creado en estado Borrador.`);
          this.submitting.set(false);
          this.router.navigate(['/panel/contabilidad/comprobantes']);
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Error al crear el comprobante contable.');
          this.submitting.set(false);
        },
      });
    }
  }

  contabilizarComprobante(): void {
    if (!this.id()) return;
    if (confirm('¿Estás seguro de contabilizar este comprobante contable? Se volverá inmutable y registrará los movimientos contables definitivos.')) {
      this.loading.set(true);
      this.service.contabilizar(this.id()!).subscribe({
        next: () => {
          this.toastService.success('Comprobante contabilizado con éxito.');
          this.cargarComprobante(this.id()!);
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Error al contabilizar.');
          this.loading.set(false);
        },
      });
    }
  }

  guardarYContabilizar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.error('Por favor complete los campos requeridos marcados en rojo.');
      return;
    }

    if (!this.estaBalanceado) {
      this.toastService.error(
        `El comprobante contable está descuadrado por $${this.diferencia.toLocaleString('es-CO')}. Débitos y Créditos deben sumar igual.`
      );
      return;
    }

    this.submitting.set(true);
    const payload = this.form.getRawValue();

    payload.detalles = payload.detalles.map((d: any) => ({
      ...d,
      clienteId: d.clienteId || null,
      proveedorId: d.proveedorId || null,
      centroCostoId: d.centroCostoId || null,
    }));

    if (this.isEditing() && this.id()) {
      this.service.update(this.id()!, payload).subscribe({
        next: (res) => {
          this.service.contabilizar(res.id).subscribe({
            next: () => {
              this.toastService.success(`Comprobante ${res.numero} guardado y contabilizado con éxito.`);
              this.submitting.set(false);
              this.router.navigate(['/panel/contabilidad/comprobantes']);
            },
            error: (err) => {
              this.toastService.error(err.error?.message || 'Error al contabilizar.', 'Error Contable');
              this.submitting.set(false);
            }
          });
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Error al actualizar el comprobante.');
          this.submitting.set(false);
        },
      });
    } else {
      this.service.create(payload).subscribe({
        next: (res) => {
          this.service.contabilizar(res.id).subscribe({
            next: () => {
              this.toastService.success(`Comprobante creado y contabilizado con éxito.`);
              this.submitting.set(false);
              this.router.navigate(['/panel/contabilidad/comprobantes']);
            },
            error: (err) => {
              this.toastService.error(err.error?.message || 'Error al contabilizar.', 'Error Contable');
              this.submitting.set(false);
            }
          });
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Error al crear el comprobante contable.');
          this.submitting.set(false);
        },
      });
    }
  }
}
