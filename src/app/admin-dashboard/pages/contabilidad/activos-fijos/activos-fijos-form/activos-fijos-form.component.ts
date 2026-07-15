import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HeaderTitlePageComponent, HeaderInput } from '@dashboard/components/header-title-page/header-title-page.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { NotificationService } from '@shared/services/notification.service';
import { FormErrorLabelComponent } from '@utils/components/form-error-label/form-error-label.component';
import { ActivosFijosService } from '../../services/activos-fijos.service';
import { CuentasContablesService } from '../../services/cuentas-contables.service';
import { ProveedoresService } from '../../../compras/services/proveedores.service';
import { CentrosCostosService } from '../../../administracion/configuraciones/pages/centros-costos/services/centros-costos.service';
import { GetCuentasContables } from '../../interfaces/cuentas-contables.interface';
import { CatalogsStore } from '@dashboard/services/catalogs.store';

@Component({
  selector: 'app-activos-fijos-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    HeaderTitlePageComponent,
    BreadcrumbComponent,
    FormErrorLabelComponent,
  ],
  templateUrl: './activos-fijos-form.component.html',
})
export class ActivosFijosFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(NotificationService);

  private activosService = inject(ActivosFijosService);
  private cuentasService = inject(CuentasContablesService);
  private proveedoresService = inject(ProveedoresService);
  private centrosCostosService = inject(CentrosCostosService);
  private catalogsStore = inject(CatalogsStore);

  public headTitle = signal<HeaderInput>({
    title: 'Nuevo Activo Fijo',
    slog: 'Registra un nuevo bien en el sistema de activos fijos',
  });

  public isEditing = signal(false);
  public id = signal<string | null>(null);
  public loading = signal(false);
  public submitting = signal(false);
  public tiposActivo = computed(() => this.catalogsStore.tiposActivo());

  public form!: FormGroup;

  public cuentasContables = signal<GetCuentasContables[]>([]);
  public proveedores = signal<any[]>([]);
  public centrosCostos = signal<any[]>([]);

  breadcrumbItems = [
    { label: 'Contabilidad', route: '/panel/contabilidad' },
    { label: 'Activos Fijos', route: '/panel/contabilidad/activos-fijos' },
    { label: 'Formulario' },
  ];

  ngOnInit(): void {
    this.initForm();
    this.cargarCatalogos();

    const paramId = this.route.snapshot.paramMap.get('id');
    if (paramId) {
      this.isEditing.set(true);
      this.id.set(paramId);
      this.cargarActivo(paramId);
    }
  }

  private initForm(): void {
    this.form = this.fb.group({
      codigo: ['', [Validators.required, Validators.maxLength(50)]],
      nombre: ['', [Validators.required, Validators.maxLength(100)]],
      descripcion: [''],
      fechaAdquisicion: [new Date().toISOString().substring(0, 10), [Validators.required]],
      valorAdquisicion: [0, [Validators.required, Validators.min(0)]],
      valorSalvamento: [0, [Validators.min(0)]],
      vidaUtilMeses: [60, [Validators.required, Validators.min(1), Validators.max(600)]],
      cuentaActivoId: ['', [Validators.required]],
      cuentaDepreciacionAcumuladaId: ['', [Validators.required]],
      cuentaGastoDepreciacionId: ['', [Validators.required]],
      tipoActivo: ['Otros tangibles', [Validators.required]],
      proveedorId: [''],
      centroCostoId: [''],
    });
  }

  private cargarCatalogos(): void {
    this.cuentasService.getCuentasContables().subscribe({
      next: (cuentas) => {
        this.cuentasContables.set(cuentas.filter(c => c.aceptaMovimiento && c.isActive));
      },
      error: () => {
        this.toastService.error('Error al cargar las cuentas contables.');
      }
    });

    this.proveedoresService.getProveedores({ limit: 1000, offset: 0 }).subscribe({
      next: (res) => {
        this.proveedores.set(res.proveedores || []);
      },
      error: () => {
        this.toastService.error('Error al cargar los proveedores.');
      }
    });

    this.centrosCostosService.loadCentrosCostos().subscribe({
      next: (centros) => {
        this.centrosCostos.set(centros.filter((cc: any) => cc.activo));
      },
      error: () => {
        this.toastService.error('Error al cargar los centros de costo.');
      }
    });
  }

  private cargarActivo(id: string): void {
    this.loading.set(true);
    this.activosService.getActivoFijo(id).subscribe({
      next: (activo) => {
        this.headTitle.set({
          title: `Editar: ${activo.nombre}`,
          slog: `Código: ${activo.codigo} | Estado: ${activo.estado}`,
        });

        this.form.patchValue({
          codigo: activo.codigo,
          nombre: activo.nombre,
          descripcion: activo.descripcion || '',
          fechaAdquisicion: activo.fechaAdquisicion.substring(0, 10),
          valorAdquisicion: activo.valorAdquisicion,
          valorSalvamento: activo.valorSalvamento,
          vidaUtilMeses: activo.vidaUtilMeses,
          cuentaActivoId: activo.cuentaActivoId,
          cuentaDepreciacionAcumuladaId: activo.cuentaDepreciacionAcumuladaId,
          cuentaGastoDepreciacionId: activo.cuentaGastoDepreciacionId,
          tipoActivo: activo.tipoActivo || 'Otros tangibles',
          proveedorId: activo.proveedorId || '',
          centroCostoId: activo.centroCostoId || '',
        });

        this.form.get('codigo')?.disable();
        this.loading.set(false);
      },
      error: () => {
        this.toastService.error('Error al cargar el activo fijo.');
        this.router.navigate(['/panel/contabilidad/activos-fijos']);
        this.loading.set(false);
      },
    });
  }

  get cuentasActivo() {
    return this.cuentasContables().filter(c => c.tipo === 'ACTIVO');
  }

  get cuentasGasto() {
    return this.cuentasContables().filter(c => c.tipo === 'GASTO');
  }

  depreciacionMensual = computed(() => {
    const valor = this.form.get('valorAdquisicion')?.value || 0;
    const salvamento = this.form.get('valorSalvamento')?.value || 0;
    const meses = this.form.get('vidaUtilMeses')?.value || 1;
    
    if (valor <= 0 || meses <= 0) return 0;
    
    const baseDepreciable = valor - salvamento;
    if (baseDepreciable <= 0) return 0;
    
    return baseDepreciable / meses;
  });

  guardar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.error('Por favor complete todos los campos requeridos.');
      return;
    }

    this.submitting.set(true);
    const payload = {
      ...this.form.getRawValue(),
      proveedorId: this.form.get('proveedorId')?.value || null,
      centroCostoId: this.form.get('centroCostoId')?.value || null,
    };

    if (this.isEditing() && this.id()) {
      this.activosService.update(this.id()!, payload).subscribe({
        next: () => {
          this.toastService.success('Activo fijo actualizado con éxito.');
          this.submitting.set(false);
          this.router.navigate(['/panel/contabilidad/activos-fijos']);
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Error al actualizar el activo fijo.');
          this.submitting.set(false);
        },
      });
    } else {
      this.activosService.create(payload).subscribe({
        next: () => {
          this.toastService.success('Activo fijo registrado con éxito.');
          this.submitting.set(false);
          this.router.navigate(['/panel/contabilidad/activos-fijos']);
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Error al crear el activo fijo.');
          this.submitting.set(false);
        },
      });
    }
  }
}
