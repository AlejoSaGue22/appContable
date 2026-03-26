import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { CuentasContablesService } from '../services/cuentas-contables.service';
import { LoaderComponent } from '@utils/components/loader/loader.component';

import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { CatalogsStore } from '@dashboard/services/catalogs.store';
import { CatalogsService } from '@dashboard/services/catalogs.service';
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { PaginationComponent } from '@shared/components/pagination/pagination';
import { effect } from '@angular/core';
import { CategoriasListComponent } from './components/categorias-list/categorias-list.component';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { CategoriaFormModalComponent } from './components/categoria-form-modal/categoria-form-modal.component';
import { CategoryArticle } from '@dashboard/interfaces/catalogs-interface';

@Component({
  selector: 'app-cuentas-contables',
  standalone: true,
  imports: [CommonModule, LoaderComponent, CurrencyPipe, HeaderTitlePageComponent, FormsModule, 
          PaginationComponent, CategoriasListComponent, CategoriaFormModalComponent],
  templateUrl: './cuentas-contables.component.html',
  providers: [PaginationService]
})
export class CuentasContablesComponent {
  private activatedRoute = inject(ActivatedRoute);
  private cuentasService = inject(CuentasContablesService);
  private catalogsStore = inject(CatalogsStore);
  private catalogsService = inject(CatalogsService);
  private paginationService = inject(PaginationService);

  tabs = signal<'cuentas' | 'categorias'>('cuentas');
  isLoadingCatalogs = this.catalogsStore.loading;

  isModalOpen = signal(false);
  selectedCategory = signal<CategoryArticle | null>(null);

  constructor() {
    this.catalogsStore.initialize();
    
    // Configurar tamaño de página a 2 para ver la paginación con pocos elementos
    this.paginationService.pageSize.set(2);

    // Sync pagination total items
    effect(() => {
      if (this.tabs() === 'categorias') {
        this.paginationService.totalItems.set(this.categoriesResource.value()?.count || 0);
      }
    });
  }

  headTitle: HeaderInput = {
    title: 'Catálogo de Cuentas Contables',
    slog: 'Visualización jerárquica del plan único de cuentas (PUC)'
  }

  cuentasResource = rxResource({
    loader: () => this.cuentasService.getCuentasContables()
  });

  categoriesResource = rxResource({
    request: () => ({
      page: this.paginationService.currentPage(),
      limit: this.paginationService.pageSize()
    }),
    loader: ({ request }) => {
      const offset = (request.page - 1) * request.limit;
      return this.catalogsService.findAllCategoriesArticles(request.limit, offset);
    }
  });

  categories = computed(() => this.categoriesResource.value()?.categoriesArticles || []);

  cuentasOrdenadas = computed(() => {
    const data = this.cuentasResource.value();
    if (!data) return [];
    
    return [...data].sort((a, b) => a.codigo.localeCompare(b.codigo));
  });

  cuentasAceptanMovimiento = computed(() => {
    return this.cuentasOrdenadas().filter(c => c.aceptaMovimiento);
  });

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

  
}
