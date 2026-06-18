import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { CuentasContablesService } from '../services/cuentas-contables.service';
import { LoaderComponent } from '@utils/components/loader/loader.component';

import {
  HeaderInput,
  HeaderTitlePageComponent,
} from '@dashboard/components/header-title-page/header-title-page.component';
import { CatalogsStore } from '@dashboard/services/catalogs.store';
import { CatalogsService } from '@dashboard/services/catalogs.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { PaginationComponent } from '@shared/components/pagination/pagination';
import { effect } from '@angular/core';
import { CategoriasListComponent } from './components/categorias-list/categorias-list.component';
import { catchError, of, tap } from 'rxjs';
import { CategoriaFormModalComponent } from './components/categoria-form-modal/categoria-form-modal.component';
import { CategoryArticle } from '@dashboard/interfaces/catalogs-interface';
import { NotificationService } from '@shared/services/notification.service';
import { CuentasContablesList } from './components/cuentas-contables-list/cuentas-contables-list.component';
import {
  CuentaDetailPanelComponent,
  PanelMode,
} from './components/cuenta-detail-panel/cuenta-detail-panel.component';
import { GetCuentasContables } from '../interfaces/cuentas-contables.interface';
import { TabsComponent, TabItem } from '@shared/components/tabs/tabs.component';

@Component({
  selector: 'app-cuentas-contables',
  standalone: true,
  imports: [
    CommonModule,
    LoaderComponent,
    HeaderTitlePageComponent,
    FormsModule,
    PaginationComponent,
    CategoriasListComponent,
    CategoriaFormModalComponent,
    CuentasContablesList,
    CuentaDetailPanelComponent,
    TabsComponent,
  ],
  templateUrl: './cuentas-contables.component.html',
  providers: [PaginationService],
})
export class CuentasContablesComponent {
  private cuentasService = inject(CuentasContablesService);
  private catalogsStore = inject(CatalogsStore);
  private catalogsService = inject(CatalogsService);
  private paginationService = inject(PaginationService);
  private notificationService = inject(NotificationService);

  tabs = signal<string>('cuentas');
  tabItems: TabItem[] = [
    { id: 'cuentas', label: 'Plan de Cuentas' },
    { id: 'categorias', label: 'Categorías de Artículos' },
  ];
  isLoadingCatalogs = this.catalogsStore.loading;

  isModalOpen = signal(false);
  selectedCategory = signal<CategoryArticle | null>(null);

  // ── Detail Panel State ────────────────────────────────────────────
  selectedAccount = signal<GetCuentasContables | null>(null);
  parentAccount = signal<GetCuentasContables | null>(null);
  panelMode = signal<PanelMode>('view');

  constructor() {
    this.catalogsStore.initialize();
    this.paginationService.pageSize.set(10);

    effect(() => {
      if (this.tabs() === 'categorias') {
        this.paginationService.totalItems.set(
          this.categoriesResource.value()?.count || 0,
        );
      }
    });
  }

  headTitle: HeaderInput = {
    title: 'Catálogo de Cuentas Contables',
    slog: 'Visualización jerárquica del plan único de cuentas (PUC)',
  };

  selectedFechaInicio = signal<string>('');
  selectedFechaFin = signal<string>('');
  appliedFechaInicio = signal<string>('');
  appliedFechaFin = signal<string>('');

  cuentasResource = rxResource({
    request: () => ({
      fechaInicio: this.appliedFechaInicio(),
      fechaFin: this.appliedFechaFin(),
    }),
    loader: ({ request }) =>
      this.cuentasService.getCuentasContables({
        fechaInicio: request.fechaInicio,
        fechaFin: request.fechaFin,
      }),
  });

  searchCuentas() {
    this.appliedFechaInicio.set(this.selectedFechaInicio());
    this.appliedFechaFin.set(this.selectedFechaFin());
  }

  clearSearch() {
    this.selectedFechaInicio.set('');
    this.selectedFechaFin.set('');
    this.appliedFechaInicio.set('');
    this.appliedFechaFin.set('');
  }

  categoriesResource = rxResource({
    request: () => ({
      page: this.paginationService.currentPage(),
      limit: 10,
    }),
    loader: ({ request }) => {
      const offset = (request.page - 1) * request.limit;
      return this.catalogsService
        .findAllCategoriesArticles(request.limit, offset)
        .pipe(
          tap((res) => {
            const size = Math.ceil(res.count / request.limit);
            this.paginationService.totalItems.set(res.count);
            this.paginationService.pageSize.set(size);
          }),
          catchError((err) => {
            this.notificationService.error(
              'Error al cargar las categorías',
              err.error?.message || 'Error desconocido',
            );
            return of(null);
          }),
        );
    },
  });

  categories = computed(
    () => this.categoriesResource.value()?.categoriesArticles || [],
  );

  cuentasOrdenadas = computed(() => {
    const data = this.cuentasResource.value();
    if (!data) return [];
    return [...data].sort((a, b) => a.codigo.localeCompare(b.codigo));
  });

  cuentasAceptanMovimiento = computed(() => {
    return this.cuentasOrdenadas().filter((c) => c.aceptaMovimiento);
  });

  // ── Categories Modal ──────────────────────────────────────────────
  openCreateModal() {
    this.selectedCategory.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(category: CategoryArticle) {
    this.selectedCategory.set(category);
    this.isModalOpen.set(true);
  }

  closeModal() {
    this.isModalOpen.set(false);
    this.selectedCategory.set(null);
  }

  onFormSubmit() {
    this.categoriesResource.reload();
  }

  // ── Detail Panel Actions ──────────────────────────────────────────
  onSelectAccount(account: GetCuentasContables): void {
    this.selectedAccount.set(account);
    this.parentAccount.set(null);
    this.panelMode.set('view');
  }

  onAddSubAccount(parent: GetCuentasContables): void {
    this.selectedAccount.set(null);
    this.parentAccount.set(parent);
    this.panelMode.set('create');
  }

  onPanelModeChange(mode: PanelMode): void {
    this.panelMode.set(mode);
  }

  onAccountSaved(): void {
    this.cuentasResource.reload();
    // After reload, reset selection to avoid stale data
    this.selectedAccount.set(null);
    this.panelMode.set('view');
  }
}
