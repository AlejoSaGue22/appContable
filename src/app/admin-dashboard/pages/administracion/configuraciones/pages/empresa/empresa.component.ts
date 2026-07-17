import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { EmpresaService, Empresa } from '@dashboard/services/empresa.service';
import { NotificationService } from '@shared/services/notification.service';
import { rxResource } from '@angular/core/rxjs-interop';
import { tap } from 'rxjs';
import { LoaderComponent } from 'src/app/utils/components/loader/loader.component';
import { FormErrorLabelComponent } from '@utils/components/form-error-label/form-error-label.component';

@Component({
  selector: 'app-empresa',
  standalone: true,
  imports: [CommonModule, HeaderTitlePageComponent, BreadcrumbComponent, ReactiveFormsModule, LoaderComponent, FormErrorLabelComponent],
  templateUrl: './empresa.component.html',
})
export class EmpresaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private empresaService = inject(EmpresaService);
  private notificationService = inject(NotificationService);

  headTitle = signal<HeaderInput>({
    title: 'Configuración de Empresa',
    slog: 'Gestiona la información y datos generales de tu organización',
  });

  breadcrumbItems = [
    { label: 'Configuración', route: '/panel/admin/settings' },
    { label: 'Empresa' },
  ];

  isSubmitting = signal<boolean>(false);

  formEmpresa: FormGroup = this.fb.group({
    nit: ['', [Validators.required]],
    razonSocial: ['', [Validators.required]],
    direccion: [''],
    telefono: [''],
    email: ['', [Validators.email]],
  });

  empresaResource = rxResource({
    loader: () => this.empresaService.getEmpresa().pipe(
      tap((res: { success: boolean; data: Empresa; message: string }) => {
        if (res.success && res.data) {
          this.formEmpresa.patchValue(res.data);
        }
      })
    )
  });

  ngOnInit(): void {}

  onSubmit(): void {
    if (this.formEmpresa.invalid) {
      this.formEmpresa.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.empresaService.updateEmpresa(this.formEmpresa.value).subscribe({
      next: (res: { success: boolean; data: Empresa; message: string }) => {
        this.isSubmitting.set(false);
        if (res.success) {
          this.notificationService.success('Información de la empresa guardada con éxito', 'Éxito');
          this.empresaResource.reload();
        } else {
          this.notificationService.error(res.message || 'Error al guardar la información');
        }
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        this.notificationService.error(err?.error?.message || 'Error de red al actualizar la información');
      }
    });
  }
}

