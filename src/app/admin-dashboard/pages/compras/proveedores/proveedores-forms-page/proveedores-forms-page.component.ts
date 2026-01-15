import { Component, inject, OnInit, signal, input, output } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { FormErrorLabelComponent } from "src/app/utils/components/form-error-label/form-error-label.component";
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

@Component({
  selector: 'app-proveedores-forms-page',
  imports: [CommonModule, ReactiveFormsModule, HeaderTitlePageComponent, FormErrorLabelComponent],
  templateUrl: './proveedores-forms-page.component.html',
  standalone: true
})
export class ProveedoresFormsPageComponent implements OnInit {
  
  isModal = input<boolean>(false);
  saveSuccess = output<any>(); // Replace 'any' with proper Interface if available
  cancel = output<void>();

  headTitle: HeaderInput = {
    title: 'Gestión de Proveedor',
    slog: 'Registra o actualiza la información de tus proveedores'
  }

  private fb = inject(FormBuilder);
  notificationService = inject(NotificationService);
  loaderService = inject(LoaderService);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);

  loading = signal<boolean>(false);
  
  proveedorId = toSignal(
    this.activatedRoute.params.pipe(
      map((param) => param['id'])
    )
  );

  formProveedor = this.fb.group({
    tipoDocumento: ['NIT', Validators.required],
    identificacion: ['', Validators.required],
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', Validators.required],
    direccion: [''],
    ciudad: [''],
    nombreContacto: [''],
    telefonoContacto: [''],
    observaciones: [''],
    estado: ['Activo']
  });

  ngOnInit(): void {
    if (this.proveedorId() && this.proveedorId() !== 'new') {
       this.loadProveedor(this.proveedorId());
       this.headTitle.title = 'Editar Proveedor';
    } else {
       this.headTitle.title = 'Nuevo Proveedor';
    }
  }

  loadProveedor(id: string) {
    this.loaderService.show();
    // Simulate loading data
    setTimeout(() => {
        // Mock data
        this.formProveedor.patchValue({
            tipoDocumento: 'NIT',
            identificacion: '900123456',
            nombre: 'Proveedor Ejemplo SAS',
            email: 'contacto@proveedor.com',
            telefono: '3001234567',
            direccion: 'Calle 123 # 45-67',
            ciudad: 'Bogotá',
            estado: 'Activo'
        });
        this.loaderService.hide();
    }, 1000);
  }

  onSubmit() {
    if (this.formProveedor.invalid) {
      this.formProveedor.markAllAsTouched();
      this.notificationService.error('Por favor revise los campos obligatorios', 'Formulario Inválido');
      return;
    }

    this.loading.set(true);
    // Simulate API call
    setTimeout(() => {
      this.loading.set(false);
      const action = this.proveedorId() === 'new' || !this.proveedorId() ? 'creado' : 'actualizado';
      this.notificationService.success(`Proveedor ${action} exitosamente`, 'Éxito');
      
      const mockProveedor = this.formProveedor.value; // In real app this comes from API

      if (this.isModal()) {
          this.saveSuccess.emit(mockProveedor);
      } else {
           setTimeout(() => {
              this.router.navigate(['/panel/compras/proveedores']);
          }, 1000);
      }

    }, 1500);
  }

  onCancel() {
      if (this.isModal()) {
          this.cancel.emit();
      } else {
          this.router.navigate(['/panel/compras/proveedores']);
      }
  }
}
