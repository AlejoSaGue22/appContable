import { Component, inject, input, output, computed, signal } from '@angular/core';
import { CategoryArticle, GetCuentasContables } from '@dashboard/interfaces/catalogs-interface';
import { CatalogsService } from '@dashboard/services/catalogs.service';
import { NotificationService } from '@shared/services/notification.service';
import { CatalogsStore } from '@dashboard/services/catalogs.store';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { LoaderService } from '@utils/services/loader.service';

@Component({
  selector: 'app-categorias-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './categorias-list.component.html',
})
export class CategoriasListComponent {

  private catalogsService = inject(CatalogsService);
  private notificationService = inject(NotificationService);
  private catalogsStore = inject(CatalogsStore);
  private loaderService = inject(LoaderService);
  
  categories = input<CategoryArticle[]>();
  cuentasAceptanMovimiento = input<GetCuentasContables[]>();
  categoryUpdated = output<void>();
  editCategory = output<CategoryArticle>();

  // Búsqueda
  searchTerm = signal('');
  filteredCategories = computed(() => {
    const list = this.categories() || [];
    const term = this.searchTerm().toLowerCase().trim();
    
    if (!term) return list;
    
    return list.filter(cat => 
      cat.nombre.toLowerCase().includes(term) || 
      cat.codigo.toLowerCase().includes(term) ||
      cat.descripcion?.toLowerCase().includes(term)
    );
  });

  // Modal de eliminación
  isDeleteModalVisible = signal(false);
  categoryToDelete = signal<CategoryArticle | null>(null);

  onEditCategory(category: CategoryArticle) {
    this.editCategory.emit(category);
  }

  onOpenDeleteModal(category: CategoryArticle) {
    this.categoryToDelete.set(category);
    this.isDeleteModalVisible.set(true);
  }

  onDeleteCategory() {
    const category = this.categoryToDelete();
    if (!category) return;

    this.loaderService.show();

    this.catalogsService.removeCategoryArticle(category.id.toString()).subscribe({
      next: () => {
        this.notificationService.success('Categoría eliminada correctamente', 'Éxito');
        this.categoryUpdated.emit();
        this.isDeleteModalVisible.set(false);
        this.categoryToDelete.set(null);
      },
      error: (err) => {
        this.notificationService.error('Error al eliminar la categoría', err.error?.message || 'Error desconocido');
      },
      complete: () => {
        this.loaderService.hide();
      }
    });
  }

  updateCategoryAccount(category: CategoryArticle, cuentaId: string, type: 'main' | 'iva' = 'main') {
    if (!cuentaId) return;
    
    const payload: any = type === 'main' 
      ? { cuentaContableId: cuentaId } 
      : { cuentaIvaId: cuentaId };
    
    this.catalogsService.updateCategoryArticle(category.id.toString(), payload)
      .subscribe({
        next: () => {
          this.notificationService.success(`Asociación de cuenta ${type === 'main' ? 'principal' : 'IVA'} actualizada`, 'Éxito');
          this.catalogsStore.initialize();
          this.categoryUpdated.emit();
        },
        error: (err) => {
          this.notificationService.error('Error al actualizar la asociación', err.error?.message || 'Error desconocido');
        }
      });
  }
  
 }
