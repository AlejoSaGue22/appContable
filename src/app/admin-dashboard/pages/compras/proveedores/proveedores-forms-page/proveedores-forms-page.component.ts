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
    tipoDocumento: ['', Validators.required],
    identificacion: ['', Validators.required],
    tipoPersona: ['', Validators.required],
    nombre: ['', Validators.required],
    apellido: ['', Validators.required],
    razonSocial: ['', Validators.required],
    dv: [''],
    email: ['', [Validators.required, Validators.email]],
    telefono: ['', Validators.required],
    direccion: [''],
    ciudad: [''],
    nombreContacto: [''],
    telefonoContacto: [''],
    observaciones: [''],
    // estado: ['A']
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

    this.formProveedor.get('tipoPersona')?.valueChanges.subscribe(value => {
      if (!value) return;
      this.toggleValidations(value);
    });

    this.formProveedor.get('tipoDocumento')?.valueChanges.subscribe(value => {
      this.handleTipoDocumentoChange(value);
    });

    this.formProveedor.get('identificacion')?.valueChanges.subscribe(value => {
      if (this.formProveedor.get('tipoDocumento')?.value === '6') {
        this.updateDV(value);
      }
    });
  }

  toggleValidations(tipo: string) {
    const nombreControl = this.formProveedor.get('nombre');
    const apellidoControl = this.formProveedor.get('apellido');
    const razonSocialControl = this.formProveedor.get('razonSocial');

    if (tipo === 'PN') {
      nombreControl?.setValidators([Validators.required]);
      apellidoControl?.setValidators([Validators.required]);
      razonSocialControl?.clearValidators();

    } else if (tipo === 'PJ') {
      razonSocialControl?.setValidators([Validators.required]);
      nombreControl?.clearValidators();
      apellidoControl?.clearValidators();
    }

    nombreControl?.updateValueAndValidity();
    apellidoControl?.updateValueAndValidity();
    razonSocialControl?.updateValueAndValidity();
  }

  private handleTipoDocumentoChange(tipo: string | null | undefined) {
    const dvControl = this.formProveedor.get('dv');
    if (tipo === '6') { // NIT
      dvControl?.setValidators([Validators.required]);
      this.updateDV(this.formProveedor.get('identificacion')?.value);
    } else {
      dvControl?.clearValidators();
      dvControl?.setValue('');
    }
    dvControl?.updateValueAndValidity();
  }

  private updateDV(nit: string | null | undefined) {
    if (!nit) {
      this.formProveedor.get('dv')?.setValue('');
      return;
    }
    const dv = this.calculateDV(nit);
    this.formProveedor.get('dv')?.setValue(dv);
  }

  private calculateDV(nit: string): string {
    const cleanNit = nit.replace(/\D/g, ''); // Solo números
    const vpri = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
    const z = cleanNit.length;
    let x = 0;
    let y = 0;

    for (let i = 0; i < z; i++) {
      y = parseInt(cleanNit.substr(i, 1));
      x += y * vpri[z - 1 - i];
    }

    y = x % 11;
    if (y > 1) {
      return (11 - y).toString();
    } else {
      return y.toString();
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
    // this.formProveedor.get("estado")?.setValue(proveedor.isActive ? 'A' : 'I');
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
    this.loading.set(true); 

    try {
      const formValue = {
        ...this.formProveedor.value,
        // isActive: this.formProveedor.get("estado")?.value === 'A' ? true : false,
        telefono: this.formProveedor.get("telefono")?.value?.toString()
      }

      // delete formValue.estado;

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
    } finally {
      this.loaderService.hide();
      this.loading.set(false);
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
