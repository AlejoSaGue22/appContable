import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeaderTitlePageComponent, HeaderInput } from '@dashboard/components/header-title-page/header-title-page.component';
import { VendedoresListComponent } from './components/vendedores-list/vendedores-list.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { VendedoresService } from './services/vendedores.service';
import { Vendedor } from './interfaces/vendedor.interface';
import { firstValueFrom } from 'rxjs';
import { PaginationComponent } from "@shared/components/pagination/pagination";
import { PaginationService } from '@shared/components/pagination/pagination.service';
import { NotificationService } from '@shared/services/notification.service';

@Component({
 selector: 'app-config-vendedores',
 standalone: true,
 imports: [CommonModule, ReactiveFormsModule, HeaderTitlePageComponent, VendedoresListComponent, ModalComponent, PaginationComponent],
 templateUrl: './vendedores.component.html',
})
export class VendedoresComponent implements OnInit {
 private fb = inject(FormBuilder);
 private vendedoresService = inject(VendedoresService);
 private paginationService = inject(PaginationService);
 private notificationService = inject(NotificationService);

 headTitle = signal<HeaderInput>({
 title: 'Vendedores',
 slog: 'Gestiona los vendedores de tu empresa'
 });

 vendedores = signal<Vendedor[]>([]);
 loading = signal<boolean>(false);
 modalVisible = signal<boolean>(false);
 isEditing = signal<boolean>(false);
 selectedId = signal<string | null>(null);

 vendedorForm: FormGroup = this.fb.group({
 nombre: ['', [Validators.required]],
 apellido: ['', [Validators.required]],
 identificacion: ['', [Validators.required]],
 telefono: [''],
 activo: [true]
 });

 ngOnInit(): void {
 this.loadData();
 }

 async loadData(page: number = 1, limit: number = 10) {
 this.loading.set(true);
 try {
 const response = await firstValueFrom(this.vendedoresService.getAll(page, limit));
 this.vendedores.set(response.data);
 this.paginationService.totalItems.set(response.meta.total);
 this.paginationService.pageSize.set(response.meta.limit);
 } catch (error) {
 this.notificationService.error('Error al cargar los vendedores', 'Error');
 } finally {
 this.loading.set(false);
 }
 }

 openNew() {
 this.isEditing.set(false);
 this.selectedId.set(null);
 this.vendedorForm.reset({ activo: true });
 this.modalVisible.set(true);
 }

 async onEdit(vendedor: Vendedor) {
 const id = vendedor.id;
 if (!id) return;

 this.isEditing.set(true);
 this.selectedId.set(id);
 try {
 const data = await firstValueFrom(this.vendedoresService.getById(id));
 this.vendedorForm.patchValue(data);
 this.modalVisible.set(true);
 } catch (error) {
 this.notificationService.error('Error al cargar el vendedor', 'Error');
 }
 }

 async save() {
 if (this.vendedorForm.invalid) return;

 const data = this.vendedorForm.value;
 try {
 if (this.isEditing() && this.selectedId()) {
 const response = await firstValueFrom(this.vendedoresService.update(this.selectedId()!, data));
 this.notificationService.success(response.message, 'Éxito');
 } else {
 const response = await firstValueFrom(this.vendedoresService.create(data));
 this.notificationService.success(response.message, 'Éxito');
 }
 this.modalVisible.set(false);
 this.loadData();
 } catch (error: any) {
 this.notificationService.error(error?.error?.message || 'Error al guardar el vendedor', 'Error');
 }
 }
}
