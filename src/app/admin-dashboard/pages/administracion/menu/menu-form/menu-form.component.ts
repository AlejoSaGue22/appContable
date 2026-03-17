// menu-form.component.ts
import {
  Component, EventEmitter, inject, Input,
  OnInit, Output, signal, computed,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MenuItem, CreateMenuDto, UpdateMenuDto } from '../../../../interfaces/menu.interface';
import { MenuService } from '../../../../services/menu.service';

@Component({
  selector: 'app-menu-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './menu-form.component.html',
})
export class MenuFormComponent implements OnInit {
  @Input() itemToEdit: MenuItem | null = null;
  @Input() allMenuItems: MenuItem[] = [];
  @Output() close = new EventEmitter<boolean>();

  private fb          = inject(FormBuilder);
  private menuService = inject(MenuService);

  menuForm!:   FormGroup;
  isSubmitting = signal(false);
  isEditMode   = signal(false);

  /** Opciones del select de padre (aplanadas, sin el ítem actual) */
  parentOptions = signal<{ id: string; title: string }[]>([]);

  ngOnInit(): void {
    this.isEditMode.set(!!this.itemToEdit);
    this.initForm();
    this.buildParentOptions();
  }

  private initForm(): void {
    this.menuForm = this.fb.group({
      title:              [this.itemToEdit?.title              || '', [Validators.required]],
      icon:               [this.itemToEdit?.icon               || ''],
      route:              [this.itemToEdit?.route              || ''],
      externalUrl:        [this.itemToEdit?.externalUrl        || ''],
      requiredPermission: [this.itemToEdit?.requiredPermission || ''],
      parentId:           [this.itemToEdit?.parentId           || ''],
      isActive:           [this.itemToEdit ? this.itemToEdit.isActive  : true],
      isVisible:          [this.itemToEdit ? this.itemToEdit.isVisible : true],
    });
  }

  private buildParentOptions(): void {
    const flatten = (items: MenuItem[], level = 0): { id: string; title: string }[] => {
      const result: { id: string; title: string }[] = [];
      for (const item of items) {
        // Excluir el ítem que se está editando (no puede ser su propio padre)
        if (this.itemToEdit && item.id === this.itemToEdit.id) continue;
        const indent = '\u00A0\u00A0'.repeat(level);
        const prefix = level > 0 ? '└ ' : '';
        result.push({ id: item.id, title: `${indent}${prefix}${item.title}` });
        if (item.children?.length) {
          result.push(...flatten(item.children, level + 1));
        }
      }
      return result;
    };
    this.parentOptions.set(flatten(this.allMenuItems));
  }

  // ── Preview del ícono en tiempo real ──────────────────────────────
  /**
   * Devuelve HTML del ícono según el valor actual del campo "icon".
   * El template hace [innerHTML]="iconPreview()" para mostrarlo.
   */
  iconPreview(): string {
    const icon = this.menuForm?.get('icon')?.value as string ?? '';
    if (!icon.trim()) return '';
    if (icon.trim().startsWith('<')) return icon;
    if (icon.includes('fa-')) return `<i class="${icon}" style="font-size:16px"></i>`;
    return `<span class="material-icons" style="font-size:18px">${icon}</span>`;
  }

  // ── Submit ────────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.menuForm.invalid) {
      this.menuForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    const v = this.menuForm.value;

    const payload: CreateMenuDto | UpdateMenuDto = {
      title:              v.title,
      icon:               v.icon,
      route:              v.route              || undefined,
      externalUrl:        v.externalUrl        || undefined,
      requiredPermission: v.requiredPermission || undefined,
      parentId:           v.parentId           || undefined,
      isActive:           v.isActive,
      isVisible:          v.isVisible,
    };

    const request$ = this.isEditMode() && this.itemToEdit
      ? this.menuService.updateMenu(this.itemToEdit.id, payload as UpdateMenuDto)
      : this.menuService.createMenu(payload as CreateMenuDto);

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.close.emit(true);
      },
      error: err => {
        console.error(err);
        this.isSubmitting.set(false);
        alert(err?.error?.message || 'Error al guardar el ítem de menú');
      },
    });
  }

  onClose(): void {
    this.close.emit(false);
  }
}