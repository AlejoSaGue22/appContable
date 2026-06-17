import { Component, input, output, computed, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Vendedor } from '../../interfaces/vendedor.interface';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { VendedoresService } from '../../services/vendedores.service';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';

@Component({
 selector: 'app-vendedores-list',
 standalone: true,
 imports: [CommonModule, FormsModule, ModalComponent],
 templateUrl: './vendedores-list.component.html',
})
export class VendedoresListComponent {
 private vendedoresService = inject(VendedoresService);
 private notificationService = inject(NotificationService);
 private loaderService = inject(LoaderService);

 vendedores = input<Vendedor[]>([]);

 edit = output<Vendedor>();
 deleted = output<void>();

 searchTerm = signal('');

 isDeleteModalVisible = signal(false);
 vendedorToDelete = signal<Vendedor | null>(null);

 filteredVendedores = computed(() => {
 const list = this.vendedores() || [];
 const term = this.searchTerm().toLowerCase().trim();

 if (!term) return list;

 return list.filter(v =>
 v.nombre.toLowerCase().includes(term) ||
 v.apellido.toLowerCase().includes(term) ||
 v.identificacion.toLowerCase().includes(term)
 );
 });

 onEdit(vendedor: Vendedor) {
 this.edit.emit(vendedor);
 }

 onOpenDeleteModal(vendedor: Vendedor) {
 this.vendedorToDelete.set(vendedor);
 this.isDeleteModalVisible.set(true);
 }

 onDeleteVendedor() {
 const vendedor = this.vendedorToDelete();
 if (!vendedor || !vendedor.id) return;

 this.loaderService.show();

 this.vendedoresService.delete(vendedor.id).subscribe({
 next: (response) => {
 this.notificationService.success(response.message, 'Éxito');
 this.deleted.emit();
 this.isDeleteModalVisible.set(false);
 this.vendedorToDelete.set(null);
 },
 error: (err) => {
 this.notificationService.error(err.error?.message || 'Error al eliminar el vendedor', 'Error');
 },
 complete: () => {
 this.loaderService.hide();
 }
 });
 }
}
