import { Component, input, output, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Impuesto } from '../../interfaces/impuesto.interface';

import { ModalComponent } from '@shared/components/modal/modal.component';
import { ImpuestosService } from '../../services/impuestos.service';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';
import { PaginationComponent } from "@shared/components/pagination/pagination";

@Component({
  selector: 'app-impuestos-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, PaginationComponent],
  templateUrl: './impuestos-list.component.html',
})
export class ImpuestosListComponent {
  private impuestosService = inject(ImpuestosService);
  private notificationService = inject(NotificationService);
  private loaderService = inject(LoaderService);

  impuestos = input<Impuesto[]>([]);
  
  edit = output<Impuesto>();
  deleted = output<void>(); // Renamed to avoided confusion with the service method

  searchTerm = signal('');

  // Delete Modal
  isDeleteModalVisible = signal(false);
  impuestoToDelete = signal<Impuesto | null>(null);

  filteredImpuestos = computed(() => {
    const list = this.impuestos() || [];
    const term = this.searchTerm().toLowerCase().trim();
    
    if (!term) return list;
    
    return list.filter(imp => 
      imp.nombre.toLowerCase().includes(term) || 
      imp.tipo.toLowerCase().includes(term) ||
      imp.descripcion?.toLowerCase().includes(term)
    );
  });

  onEdit(impuesto: Impuesto) {
    this.edit.emit(impuesto);
  }

  onOpenDeleteModal(impuesto: Impuesto) {
    this.impuestoToDelete.set(impuesto);
    this.isDeleteModalVisible.set(true);
  }

  onDeleteImpuesto() {
    const impuesto = this.impuestoToDelete();
    if (!impuesto || !impuesto.id) return;

    this.loaderService.show();

    this.impuestosService.delete(impuesto.id).subscribe({
      next: () => {
        this.notificationService.success('Impuesto eliminado correctamente', 'Éxito');
        this.deleted.emit();
        this.isDeleteModalVisible.set(false);
        this.impuestoToDelete.set(null);
      },
      error: (err) => {
        this.notificationService.error('Error al eliminar el impuesto', err.error?.message || 'Error desconocido');
      },
      complete: () => {
        this.loaderService.hide();
      }
    });
  }
}
