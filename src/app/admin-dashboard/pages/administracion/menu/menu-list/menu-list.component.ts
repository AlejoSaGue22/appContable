// menu-list.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { MenuService } from '../../../../services/menu.service';
import { MenuItem } from '../../../../interfaces/menu.interface';
import { MenuFormComponent } from '../menu-form/menu-form.component';

import { ModalComponent } from '@shared/components/modal/modal.component';

@Component({
  selector: 'app-menu-list',
  standalone: true,
  imports: [CommonModule, DragDropModule, MenuFormComponent, ModalComponent],
  templateUrl: './menu-list.component.html',
})
export class MenuListComponent implements OnInit {
  private menuService = inject(MenuService);

  menuItems           = signal<MenuItem[]>([]);
  isLoading           = signal(false);
  isModalOpen         = signal(false);
  selectedItemForEdit = signal<MenuItem | null>(null);
  expandedItems       = signal<Set<string>>(new Set());

  // Modales de confirmación
  isDeleteModalVisible = signal(false);
  itemToDelete = signal<MenuItem | null>(null);
  isSeedModalVisible = signal(false);

  ngOnInit(): void {
    this.loadMenu();
  }

  loadMenu(): void {
    this.isLoading.set(true);
    this.menuService.getAllMenu().subscribe({
      next: res => {
        if (res.success) {
          // flattenTree para la vista de lista (el árbol ya viene del backend)
          // this.menuItems.set(this.flattenTree(res.data || []));
          this.menuItems.set(res.data || []);
        }
        this.isLoading.set(false);
      },
      error: err => {
        console.error('Error cargando menú', err);
        this.isLoading.set(false);
      },
    });
  }

  /**
   * Aplana el árbol del menú en una lista lineal manteniendo el orden
   * y conservando la referencia al padre para mostrar niveles.
   */
  private flattenTree(items: MenuItem[], parentId?: string): MenuItem[] {
    const result: MenuItem[] = [];
    for (const item of items) {
      const flatItem = { ...item, parentId: parentId ?? item.parentId };
      result.push(flatItem);
      if (item.children?.length) {
        result.push(...this.flattenTree(item.children, item.id));
      }
    }
    return result;
  }

  toggleExpand(itemId: string): void {
    const next = new Set(this.expandedItems());
    if (next.has(itemId)) {
      next.delete(itemId);
    } else {
      next.add(itemId);
    }
    this.expandedItems.set(next);
  }

  isExpanded(itemId: string): boolean {
    return this.expandedItems().has(itemId);
  }

  // ── Modal ─────────────────────────────────────────────────────────
  openCreateModal(): void {
    this.selectedItemForEdit.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(item: MenuItem): void {
    this.selectedItemForEdit.set(item);
    this.isModalOpen.set(true);
  }

  closeModal(refresh: boolean = false): void {
    this.isModalOpen.set(false);
    this.selectedItemForEdit.set(null);
    if (refresh) this.loadMenu();
  }

  // ── Acciones ──────────────────────────────────────────────────────
  toggleActive(item: MenuItem): void {
    this.menuService.toggleActive(item.id, !item.isActive).subscribe({
      next:  () => this.loadMenu(),
      error: err => console.error(err),
    });
  }

  toggleVisible(item: MenuItem): void {
    this.menuService.toggleVisible(item.id, !item.isVisible).subscribe({
      next:  () => this.loadMenu(),
      error: err => console.error(err),
    });
  }

  deleteItem(item: MenuItem): void {
    if (item.children?.length) {
      // Usamos alert nativo para validación simple, pero podríamos usar un modal de advertencia también
      alert('No se puede eliminar un ítem con sub-ítems. Elimine los hijos primero.');
      return;
    }
    this.itemToDelete.set(item);
    this.isDeleteModalVisible.set(true);
  }

  confirmDeleteItem(): void {
    const item = this.itemToDelete();
    if (!item) return;

    this.menuService.deleteMenu(item.id).subscribe({
      next:  () => {
        this.loadMenu();
        this.isDeleteModalVisible.set(false);
        this.itemToDelete.set(null);
      },
      error: err => console.error(err),
    });
  }

  seedMenu(): void {
    this.isSeedModalVisible.set(true);
  }

  confirmSeedMenu(): void {
    this.menuService.seedMenu().subscribe({
      next:  () => {
        this.loadMenu();
        this.isSeedModalVisible.set(false);
      },
      error: err => console.error(err),
    });
  }

  // ── Drag & Drop ───────────────────────────────────────────────────
  drop(event: CdkDragDrop<MenuItem[]>): void {
    const currentItems = [...this.menuItems()];
    moveItemInArray(currentItems, event.previousIndex, event.currentIndex);
    this.menuItems.set(currentItems);

    this.updateReorder(currentItems);
  }

  dropChild(event: CdkDragDrop<MenuItem[]>, parent: MenuItem): void {
    const children = [...(parent.children || [])];
    moveItemInArray(children, event.previousIndex, event.currentIndex);
    
    // Actualización optimista en el árbol
    parent.children = children;
    this.menuItems.set([...this.menuItems()]);

    this.updateReorder(children);
  }

  private updateReorder(items: MenuItem[]): void {
    this.menuService.reorderMenu({ orderedIds: items.map(i => i.id) }).subscribe({
      error: () => {
        console.error('Error al reordenar');
        this.loadMenu(); // rollback si falla
      },
    });
  }

  // ── Helper: renderizar ícono ──────────────────────────────────────
  /**
   * Devuelve HTML seguro para renderizar el ícono.
   * Soporta:
   *  - HTML completo: "<i class='fa fa-home'></i>"
   *  - Nombre de Material Icon: "home"
   *  - Clase FA directa: "fa-solid fa-home"
   */
  renderIcon(icon: string): string {
    if (!icon) return '';

    // Ya es HTML (empieza con < )
    if (icon.trim().startsWith('<')) return icon;

    // Es una clase FA (contiene 'fa-')
    if (icon.includes('fa-')) {
      return `<i class="${icon}"></i>`;
    }

    // Es un nombre de Material Icon
    return `<span class="material-icons" style="font-size:18px">${icon}</span>`;
  }
}