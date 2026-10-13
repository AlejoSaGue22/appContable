import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { NotificationService } from '@shared/services/notification.service';
import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { ProfesionalResponsable } from '@dashboard/pages/ventas/interfaces/prescripcion.interface';
import { PrescripcionesService } from '@dashboard/pages/ventas/services/prescripciones.service';
import { HelpersUtils } from '@utils/helpers.utils';

type ProfesionalFilter = 'TODOS' | 'ACTIVOS' | 'INACTIVOS';

@Component({
  selector: 'app-profesionales',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HeaderTitlePageComponent, BreadcrumbComponent, ModalComponent],
  templateUrl: './profesionales.component.html',
})
export class ProfesionalesComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(PrescripcionesService);
  private readonly notify = inject(NotificationService);

  readonly headTitle = signal<HeaderInput>({
    title: 'Profesionales responsables',
    slog: 'Administra el directorio clínico y las firmas que aparecerán en las prescripciones.',
  });
  readonly breadcrumbItems = [
    { label: 'Configuración', route: '/panel/admin/settings' },
    { label: 'Profesionales responsables' },
  ];

  readonly profesionales = signal<ProfesionalResponsable[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly modalVisible = signal(false);
  readonly isEditing = signal(false);
  readonly selectedId = signal<string | null>(null);
  readonly searchTerm = signal('');
  readonly filter = signal<ProfesionalFilter>('TODOS');
  readonly firmaPreview = signal<string | null>(null);
  readonly firmaFile = signal<File | null>(null);
  private previewObjectUrl: string | null = null;

  readonly activeCount = computed(() => this.profesionales().filter((item) => item.activo).length);
  readonly signatureCount = computed(() => this.profesionales().filter((item) => !!item.firmaUrl).length);
  readonly filteredProfessionals = computed(() => {
    const term = this.searchTerm().trim().toLocaleLowerCase();
    const filter = this.filter();
    return this.profesionales().filter((item) => {
      if (filter === 'ACTIVOS' && !item.activo) return false;
      if (filter === 'INACTIVOS' && item.activo) return false;
      if (!term) return true;
      return [item.nombre, item.especialidad, item.registroProfesional]
        .some((value) => (value || '').toLocaleLowerCase().includes(term));
    });
  });

  readonly professionalForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.maxLength(150)]],
    especialidad: ['', Validators.maxLength(120)],
    registroProfesional: ['', Validators.maxLength(80)],
    activo: [true],
  });

  ngOnInit(): void {
    void this.loadProfessionals();
  }

  ngOnDestroy(): void {
    this.releasePreviewUrl();
  }

  async loadProfessionals(): Promise<void> {
    this.loading.set(true);
    try {
      const response = await firstValueFrom(this.service.listProfesionales(true));
      this.profesionales.set(response.data || []);
    } catch (error: any) {
      this.notify.error(error?.error?.message || 'No se pudo cargar el directorio profesional', 'Error');
    } finally {
      this.loading.set(false);
    }
  }

  openNew(): void {
    this.resetSignaturePreview();
    this.isEditing.set(false);
    this.selectedId.set(null);
    this.professionalForm.reset({ nombre: '', especialidad: '', registroProfesional: '', activo: true });
    this.modalVisible.set(true);
  }

  openEdit(item: ProfesionalResponsable): void {
    this.resetSignaturePreview();
    this.isEditing.set(true);
    this.selectedId.set(item.id);
    this.professionalForm.patchValue({
      nombre: item.nombre,
      especialidad: item.especialidad || '',
      registroProfesional: item.registroProfesional || '',
      activo: item.activo,
    });
    this.firmaPreview.set(item.firmaUrl ? HelpersUtils.resolveLogoUrl(item.firmaUrl) : null);
    this.modalVisible.set(true);
  }

  onFirmaSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      this.notify.warning('Selecciona un archivo de imagen para la firma', 'Formato no válido');
      input.value = '';
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.notify.warning('La imagen debe pesar máximo 5 MB', 'Archivo demasiado grande');
      input.value = '';
      return;
    }

    this.releasePreviewUrl();
    this.firmaFile.set(file);
    this.previewObjectUrl = URL.createObjectURL(file);
    this.firmaPreview.set(this.previewObjectUrl);
    input.value = '';
  }

  clearSelectedFirma(): void {
    this.releasePreviewUrl();
    this.firmaFile.set(null);
    const selected = this.profesionales().find((item) => item.id === this.selectedId());
    this.firmaPreview.set(selected?.firmaUrl ? HelpersUtils.resolveLogoUrl(selected.firmaUrl) : null);
  }

  closeForm(): void {
    this.modalVisible.set(false);
    this.resetSignaturePreview();
  }

  firmaSrc(item: ProfesionalResponsable): string | null {
    return item.firmaUrl ? HelpersUtils.resolveLogoUrl(item.firmaUrl) : null;
  }

  async save(): Promise<void> {
    if (this.professionalForm.invalid || this.saving()) {
      this.professionalForm.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.professionalForm.getRawValue();
    const payload = {
      nombre: formValue.nombre?.trim() || '',
      especialidad: formValue.especialidad?.trim() || undefined,
      registroProfesional: formValue.registroProfesional?.trim() || undefined,
      activo: formValue.activo ?? true,
    };
    let professionalId = this.selectedId();
    try {
      if (this.isEditing() && professionalId) {
        await firstValueFrom(this.service.updateProfesional(professionalId, payload));
      } else {
        const response = await firstValueFrom(this.service.createProfesional(payload));
        professionalId = response?.data?.id || response?.id || null;
        if (!professionalId) throw new Error('No se recibió el identificador del profesional');
        this.selectedId.set(professionalId);
        this.isEditing.set(true);
      }

      if (this.firmaFile() && professionalId) {
        await firstValueFrom(this.service.uploadFirma(professionalId, this.firmaFile()!));
      }

      this.notify.success('Profesional guardado correctamente', 'Cambios guardados');
      this.closeForm();
      await this.loadProfessionals();
    } catch (error: any) {
      this.notify.error(error?.error?.message || error?.message || 'No se pudo guardar el profesional', 'Error');
      await this.loadProfessionals();
    } finally {
      this.saving.set(false);
    }
  }

  private resetSignaturePreview(): void {
    this.releasePreviewUrl();
    this.firmaFile.set(null);
    this.firmaPreview.set(null);
  }

  private releasePreviewUrl(): void {
    if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl);
    this.previewObjectUrl = null;
  }
}
