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
import { ImpuestosFormsComponent } from './components/impuestos-forms/impuestos-forms.component';

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
    LoaderComponent,
    ImpuestosFormsComponent
  ],
  templateUrl: './impuestos.component.html',
})
export class ImpuestosComponent implements OnInit {
  private fb = inject(FormBuilder);
  private impuestosService = inject(ImpuestosService);
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
  loading = signal<boolean>(false);
  modalVisible = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  selectedId = signal<string | null>(null);

  ngOnInit(): void {
    this.loadData();
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

  openNew() {
    this.isEditing.set(false);
    this.selectedId.set(null);
    this.modalVisible.set(true);
  }

  async onEdit(impuesto: Impuesto) {
    const id = impuesto.id;
    if (!id) {
      return;
    }
    this.isEditing.set(true);
    this.selectedId.set(id);
    this.modalVisible.set(true);
  }

  onSaveSuccess() {
    this.modalVisible.set(false);
    this.loadData();
  }
}
