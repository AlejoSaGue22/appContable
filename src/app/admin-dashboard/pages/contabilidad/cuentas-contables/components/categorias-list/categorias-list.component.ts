import { Component, inject, input, output } from '@angular/core';
import { CategoryArticle, GetCuentasContables } from '@dashboard/interfaces/catalogs-interface';
import { CatalogsService } from '@dashboard/services/catalogs.service';
import { NotificationService } from '@shared/services/notification.service';
import { CatalogsStore } from '@dashboard/services/catalogs.store';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-categorias-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './categorias-list.component.html',
})
export class CategoriasListComponent {

  private catalogsService = inject(CatalogsService);
  private notificationService = inject(NotificationService);
  private catalogsStore = inject(CatalogsStore);
  
  categories = input<CategoryArticle[]>();
  cuentasAceptanMovimiento = input<GetCuentasContables[]>();
  categoryUpdated = output<void>();

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
