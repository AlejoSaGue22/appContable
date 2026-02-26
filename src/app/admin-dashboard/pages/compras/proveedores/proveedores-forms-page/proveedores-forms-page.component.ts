import { Component, inject, OnInit, signal, input, output } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { FormErrorLabelComponent } from "src/app/utils/components/form-error-label/form-error-label.component";
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map, of, tap } from 'rxjs';
import { ProveedoresInterface } from '@dashboard/interfaces/proveedores-interface';
import { ProveedoresService } from '../../services/proveedores.service';
import { LoaderComponent } from "@utils/components/loader/loader.component";
import { CatalogsStore } from '@dashboard/services/catalogs.store';
import { HelpersUtils } from '@utils/helpers.utils';

@Component({
  selector: 'app-proveedores-forms-page',
  imports: [CommonModule, ReactiveFormsModule, HeaderTitlePageComponent, FormErrorLabelComponent, LoaderComponent],
  templateUrl: './proveedores-forms-page.component.html',
  standalone: true
})
export class ProveedoresFormsPageComponent implements OnInit {

  private fb = inject(FormBuilder);
  notificationService = inject(NotificationService);
  loaderService = inject(LoaderService);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);
  private proveedoresService = inject(ProveedoresService);
  catalogsStore = inject(CatalogsStore);

  
  headTitle: HeaderInput = {
    title: 'Gestión de Proveedor',
    slog: 'Registra o actualiza la información de tus proveedores'
  }
  
  
  isModal = input<boolean>(false);
  saveSuccess = output<ProveedoresInterface>();
  cancel = output<void>();
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
    estado: ['A']
  });

  ngOnInit(): void {
    if (this.proveedorId() && this.proveedorId() !== 'new-Item') {
      this.loadProveedor(this.proveedorId());
      this.headTitle.title = 'Editar Proveedor';
    } else {
      this.headTitle.title = 'Nuevo Proveedor';
    }

    if (this.isModal()) {
      this.formProveedor.reset();
    }
  }

  proveedorIdResource = rxResource({
    request: () => {
      if (this.isModal()) return null;

      return { id: this.proveedorId() }
    },
    loader: ({ request }) => {
      if (!request) {
        this.formProveedor.reset();
        return of(null);
      }
      return this.proveedoresService.getProveedoresById(request.id).pipe(
        tap((el) => this.loadProveedor(el))
      )
    }
  })

  loadProveedor(proveedor: ProveedoresInterface) {
    this.loaderService.show();
    this.formProveedor.patchValue(proveedor);
    this.formProveedor.get("estado")?.setValue(proveedor.isActive ? 'A' : 'I');
    this.loaderService.hide();
  }

  async onSubmit() {
    const valid = this.formProveedor.valid
    if (!valid) {
      this.formProveedor.markAllAsTouched();
      this.notificationService.error('Por favor revise los campos obligatorios', 'Formulario Inválido');
      return;
    }

    this.loaderService.show();

    try {
      const formValue = {
        ...this.formProveedor.value,
        isActive: this.formProveedor.get("estado")?.value === 'Activo' ? true : false,
        telefono: this.formProveedor.get("telefono")?.value?.toString()
      }

      delete formValue.estado;

      if (this.proveedorId() == 'new-Item' || this.isModal()) {
        const client = await firstValueFrom(this.proveedoresService.createProveedor(formValue as Partial<ProveedoresInterface>));

        this.loaderService.hide();
        if (client.success == false) {
          console.log(client.error);
          this.notificationService.error(`Hubo un error al guardar el proveedor ${HelpersUtils.getMessageError(client.message)}`, 'Error');
          return;
        }

        this.notificationService.success("Proveedor guardado exitosamente", 'Éxito');

        if (this.isModal()) {
          this.saveSuccess.emit(client.data);
        } else {
          await this.router.navigateByUrl('/panel/compras/proveedores');
        }

      } else {
        const client = await firstValueFrom(this.proveedoresService.updateProveedor(this.proveedorId(), formValue as Partial<ProveedoresInterface>));

        if (client.success == false) {
          console.log(client.error);
          this.notificationService.error(`Hubo un error al guardar el proveedor ${HelpersUtils.getMessageError(client.message)}`, 'Error');
          return;
        }

        this.notificationService.success("Proveedor actualizado exitosamente", 'Éxito');
        await this.router.navigateByUrl('/panel/compras/proveedores');
      }

    } catch (error: any) {
      this.notificationService.error(error.message, 'Error');
    }

  }

  onCancel() {
    if (this.isModal()) {
      this.cancel.emit();
    } else {
      this.router.navigate(['/panel/compras/proveedores']);
    }
  }
}
