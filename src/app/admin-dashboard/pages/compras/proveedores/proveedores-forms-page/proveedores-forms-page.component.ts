import {
  Component,
  inject,
  OnInit,
  signal,
  input,
  output,
} from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  HeaderInput,
  HeaderTitlePageComponent,
} from '@dashboard/components/header-title-page/header-title-page.component';
import { FormErrorLabelComponent } from 'src/app/utils/components/form-error-label/form-error-label.component';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map, of, tap } from 'rxjs';
import { ProveedoresInterface } from '@dashboard/interfaces/proveedores-interface';
import { ProveedoresService } from '../../services/proveedores.service';
import { LoaderComponent } from '@utils/components/loader/loader.component';
import { CatalogsStore } from '@dashboard/services/catalogs.store';
import { HelpersUtils } from '@utils/helpers.utils';
import { ListGroupDropdownComponent } from '@shared/components/list-group-dropdown/list-group-dropdown.component';
import { Municipality } from '@dashboard/interfaces/catalogs-interface';
import { CuentasContablesService } from '@dashboard/pages/contabilidad/services/cuentas-contables.service';
import type { GetCuentasContables } from '@dashboard/pages/contabilidad/interfaces/cuentas-contables.interface';
import {
  applyPersonaValidations,
  calculateNitDv,
  filterCuentasByPrefix,
  findMunicipality,
  formatMunicipality,
  getUnknownErrorMessage,
  toOptionalMunicipalityId,
  toTipoDocumentoId,
} from '@dashboard/services/tercero-form.helpers';

@Component({
  selector: 'app-proveedores-forms-page',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HeaderTitlePageComponent,
    FormErrorLabelComponent,
    LoaderComponent,
    ListGroupDropdownComponent,
  ],
  templateUrl: './proveedores-forms-page.component.html',
  standalone: true,
})
export class ProveedoresFormsPageComponent implements OnInit {
  private fb = inject(FormBuilder);
  notificationService = inject(NotificationService);
  loaderService = inject(LoaderService);
  router = inject(Router);
  activatedRoute = inject(ActivatedRoute);
  private proveedoresService = inject(ProveedoresService);
  private cuentasService = inject(CuentasContablesService);
  catalogsStore = inject(CatalogsStore);

  headTitle: HeaderInput = {
    title: 'Gestión de Proveedor',
    slog: 'Registra o actualiza la información de tus proveedores',
  };

  isModal = input<boolean>(false);
  saveSuccess = output<ProveedoresInterface>();
  cancel = output<void>();
  loading = signal<boolean>(false);

  cuentasContables = signal<GetCuentasContables[]>([]);
  cuentasFiltradas = signal<GetCuentasContables[]>([]);

  proveedorId = toSignal(
    this.activatedRoute.params.pipe(map((param) => param['id'])),
  );

  formProveedor = this.fb.group({
    tipoDocumento: new FormControl<number | string | null>(null, Validators.required),
    identificacion: new FormControl<string | null>('', Validators.required),
    tipoPersona: new FormControl<string | null>('', Validators.required),
    nombre: new FormControl<string | null>('', Validators.required),
    apellido: new FormControl<string | null>('', Validators.required),
    razonSocial: new FormControl<string | null>('', Validators.required),
    dv: new FormControl<string | null>(''),
    email: new FormControl<string | null>('', [Validators.required, Validators.email]),
    telefono: new FormControl<string | null>('', Validators.required),
    direccion: new FormControl<string | null>(''),
    ciudad: new FormControl<number | string | null>(null),
    nombreContacto: new FormControl<string | null>(''),
    telefonoContacto: new FormControl<string | null>(''),
    observaciones: new FormControl<string | null>(''),
    cuentaContableId: new FormControl<string | null>(null),
  });

  getCityName(): string {
    const ref = this.formProveedor.get('ciudad')?.value as number | string | null | undefined;
    return formatMunicipality(findMunicipality(this.catalogsStore.municipalities(), ref));
  }

  onCitySelect(city: Municipality): void {
    this.formProveedor.patchValue({ ciudad: city.id });
  }

  async ngOnInit() {
    if (this.proveedorId() && this.proveedorId() !== 'new-Item') {
      this.loadProveedor(this.proveedorId());
      this.headTitle.title = 'Editar Proveedor';
    } else {
      this.headTitle.title = 'Nuevo Proveedor';
    }

    if (this.isModal()) {
      this.formProveedor.reset();
    }

    this.formProveedor.get('tipoPersona')?.valueChanges.subscribe((value) => {
      if (!value) return;
      this.toggleValidations(value);
    });

    this.formProveedor.get('tipoDocumento')?.valueChanges.subscribe((value) => {
      this.handleTipoDocumentoChange(value);
    });

    this.formProveedor
      .get('identificacion')
      ?.valueChanges.subscribe((value) => {
        if (this.formProveedor.get('tipoDocumento')?.value == '6') {
          this.updateDV(value);
        }
      });

    try {
      const accounts = await firstValueFrom(
        this.cuentasService.getCuentasContables(),
      );
      this.cuentasContables.set(accounts);
      this.cuentasFiltradas.set(filterCuentasByPrefix(accounts, '22'));
    } catch {
      this.notificationService.error('Error al cargar cuentas contables', 'Error');
    }
  }

  getCuentaContableDisplay(): string {
    const id = this.formProveedor.get('cuentaContableId')?.value as string | null;
    if (!id) return '';
    const account = this.cuentasContables().find((c) => c.id === id);
    return account ? `${account.codigo} - ${account.nombre}` : '';
  }

  onCuentaSelect(account: GetCuentasContables): void {
    this.formProveedor.patchValue({ cuentaContableId: account.id });
  }

  toggleValidations(tipo: string): void {
    applyPersonaValidations(this.formProveedor, tipo);
  }

  private handleTipoDocumentoChange(tipo: number | string | null | undefined): void {
    const dvControl = this.formProveedor.get('dv');
    if (String(tipo ?? '') === '6') {
      // NIT
      dvControl?.setValidators([Validators.required]);
      this.updateDV(this.formProveedor.get('identificacion')?.value);
    } else {
      dvControl?.clearValidators();
      dvControl?.setValue('');
    }
    dvControl?.updateValueAndValidity();
  }

  private updateDV(nit: string | null | undefined): void {
    if (!nit) {
      this.formProveedor.get('dv')?.setValue('');
      return;
    }
    this.formProveedor.get('dv')?.setValue(calculateNitDv(nit));
  }

  proveedorIdResource = rxResource({
    request: () => {
      if (this.isModal()) return null;

      return { id: this.proveedorId() };
    },
    loader: ({ request }) => {
      if (!request) {
        this.formProveedor.reset();
        return of(null);
      }
      return this.proveedoresService
        .getProveedoresById(request.id)
        .pipe(tap((el) => this.loadProveedor(el)));
    },
  });

  loadProveedor(proveedor: ProveedoresInterface): void {
    this.loaderService.show();
    this.formProveedor.patchValue(proveedor);
    this.loaderService.hide();
  }

  async onSubmit() {
    const valid = this.formProveedor.valid;
    if (!valid) {
      this.formProveedor.markAllAsTouched();
      this.notificationService.error(
        'Por favor revise los campos obligatorios',
        'Formulario Inválido',
      );
      return;
    }

    this.loaderService.show();
    this.loading.set(true);

    try {
      const raw = this.formProveedor.getRawValue();
      const formValue: Partial<ProveedoresInterface> = {
        tipoDocumento: toTipoDocumentoId(raw.tipoDocumento),
        identificacion: raw.identificacion ?? '',
        tipoPersona: raw.tipoPersona ?? '',
        nombre: raw.nombre ?? '',
        apellido: raw.apellido ?? '',
        razonSocial: raw.razonSocial ?? '',
        dv: raw.dv ?? '',
        email: raw.email ?? '',
        telefono: raw.telefono?.toString() ?? '',
        direccion: raw.direccion ?? '',
        ciudad: toOptionalMunicipalityId(raw.ciudad),
        nombreContacto: raw.nombreContacto ?? '',
        telefonoContacto: raw.telefonoContacto ?? '',
        observaciones: raw.observaciones ?? '',
        cuentaContableId: raw.cuentaContableId ?? null,
      };

      if (this.proveedorId() == 'new-Item' || this.isModal()) {
        const client = await firstValueFrom(
          this.proveedoresService.createProveedor(
            formValue as Partial<ProveedoresInterface>,
          ),
        );

        this.loaderService.hide();
        if (client.success == false) {
          this.notificationService.error(
            `Hubo un error al guardar el proveedor ${HelpersUtils.getMessageError(client.message)}`,
            'Error',
          );
          return;
        }

        this.notificationService.success(
          'Proveedor guardado exitosamente',
          'Éxito',
        );

        if (this.isModal()) {
          this.saveSuccess.emit(client.data);
        } else {
          await this.router.navigateByUrl('/panel/compras/proveedores');
        }
      } else {
        const client = await firstValueFrom(
          this.proveedoresService.updateProveedor(
            this.proveedorId(),
            formValue as Partial<ProveedoresInterface>,
          ),
        );

        if (client.success == false) {
          this.notificationService.error(
            `Hubo un error al guardar el proveedor ${HelpersUtils.getMessageError(client.message)}`,
            'Error',
          );
          return;
        }

        this.notificationService.success(
          'Proveedor actualizado exitosamente',
          'Éxito',
        );
        await this.router.navigateByUrl('/panel/compras/proveedores');
      }
    } catch (error: unknown) {
      this.notificationService.error(getUnknownErrorMessage(error), 'Error');
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
