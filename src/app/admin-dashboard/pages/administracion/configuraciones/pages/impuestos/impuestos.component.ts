import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  HeaderTitlePageComponent,
  HeaderInput,
} from '@dashboard/components/header-title-page/header-title-page.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ImpuestosListComponent } from './components/impuestos-list/impuestos-list.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { ImpuestosService } from './services/impuestos.service';
import { Impuesto } from './interfaces/impuesto.interface';
import { CuentasContablesService } from '@dashboard/pages/contabilidad/services/cuentas-contables.service';
import { firstValueFrom } from 'rxjs';
import { PaginationComponent } from '@shared/components/pagination/pagination';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderComponent } from "@utils/components/loader/loader.component";

@Component({
  selector: 'app-config-impuestos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderTitlePageComponent,
    BreadcrumbComponent,
    ImpuestosListComponent,
    ModalComponent,
    PaginationComponent,
    LoaderComponent
  ],
  templateUrl: './impuestos.component.html',
})
export class ImpuestosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private impuestosService = inject(ImpuestosService);
  private cuentasService = inject(CuentasContablesService);
  private paginationService = inject(PaginationService);
  private notificationService = inject(NotificationService);

  headTitle = signal<HeaderInput>({
    title: 'Impuestos',
    slog: 'Define los tipos de impuestos y retenciones que aplicas en tus transacciones',
  });

  breadcrumbItems = [
    { label: 'Configuración', route: '/panel/admin/settings' },
    { label: 'Impuestos' },
  ];

  impuestos = signal<Impuesto[]>([]);
  cuentas = signal<any[]>([]);
  cuentasFiltradas = computed(() => {
    return this.cuentas().filter(
      (c) =>
        c.aceptaMovimiento &&
        (c.codigo.startsWith('1355') ||
          c.codigo.startsWith('24') ||
          c.codigo.startsWith('2365') ||
          c.codigo.startsWith('2367') ||
          c.codigo.startsWith('2368') ||
          c.codigo.startsWith('2370')),
    );
  });
  loading = signal<boolean>(false);
  modalVisible = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  selectedId = signal<string | null>(null);
  showAdvanced = signal<boolean>(false);

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

  ngOnInit(): void {
    this.loadData();
    this.loadCuentas();
  }

  async loadData(page: number = 1, limit: number = 10) {
    this.loading.set(true);
    try {
      const response = await firstValueFrom(
        this.impuestosService.getAll(page, limit),
      );
      this.impuestos.set(response.data);
      this.paginationService.totalItems.set(response.meta.total);
      this.paginationService.pageSize.set(response.meta.totalPages);
    } catch (error) {
      this.notificationService.error('Error al cargar los impuestos', 'Error');
    } finally {
      this.loading.set(false);
    }
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

  openNew() {
    this.isEditing.set(false);
    this.selectedId.set(null);
    this.taxForm.reset({
      activo: true,
      tipo: 'IVA',
      tarifa: 0,
      isAcreditable: false,
    });
    this.modalVisible.set(true);
  }

  async onEdit(impuesto: Impuesto) {
    const id = impuesto.id;
    if (!id) {
      return;
    }
    this.isEditing.set(true);
    this.selectedId.set(id);
    try {
      const data = await firstValueFrom(this.impuestosService.getById(id));
      this.taxForm.patchValue({
        ...data,
        tarifa: parseInt(data.tarifa),
      });
      this.modalVisible.set(true);
    } catch (error) {
      this.notificationService.error('Error al cargar el impuesto', 'Error');
    }
  }

  async save() {
    if (this.taxForm.invalid) return;

    const data = this.taxForm.value;
    try {
      if (this.isEditing() && this.selectedId()) {
        const response = await firstValueFrom(
          this.impuestosService.update(this.selectedId()!, data),
        );
        this.notificationService.success(response.message, 'Éxito');
      } else {
        const response = await firstValueFrom(
          this.impuestosService.create(data),
        );
        this.notificationService.success(response.message, 'Éxito');
      }
      this.modalVisible.set(false);
      this.loadData();
    } catch (error: any) {
      this.notificationService.error(
        error?.error?.message || 'Error al guardar el impuesto',
        'Error',
      );
    }
  }

  toggleAdvanced() {
    this.showAdvanced.update((v) => !v);
  }
}
