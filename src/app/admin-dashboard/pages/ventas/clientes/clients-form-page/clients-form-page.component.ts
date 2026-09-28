import {
  Component,
  inject,
  OnInit,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  HeaderInput,
  HeaderTitlePageComponent,
} from '@dashboard/components/header-title-page/header-title-page.component';
import { FormErrorLabelComponent } from 'src/app/utils/components/form-error-label/form-error-label.component';
import { ClientesService } from '../../services/clientes.service';
import { ActivatedRoute, Router } from '@angular/router';
import {
  ClientesInterfaceResponse,
  ClientesFormInterface,
} from '@dashboard/interfaces/clientes-interface';
import { firstValueFrom, map, tap } from 'rxjs';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { LoaderComponent } from 'src/app/utils/components/loader/loader.component';
import { ErrorPageComponent } from 'src/app/utils/components/error-page/error-page.component';
import { NotificationService } from '@shared/services/notification.service';
import { CatalogsStore } from '@dashboard/services/catalogs.store';
import { Municipality } from '@dashboard/interfaces/catalogs-interface';
import { HelpersUtils } from '@utils/helpers.utils';
import { ListGroupDropdownComponent } from '@shared/components/list-group-dropdown/list-group-dropdown.component';
import { CuentasContablesService } from '@dashboard/pages/contabilidad/services/cuentas-contables.service';
import type { GetCuentasContables } from '@dashboard/pages/contabilidad/interfaces/cuentas-contables.interface';
import {
  applyPersonaValidations,
  calculateNitDv,
  filterCuentasByPrefix,
  findMunicipality,
  formatMunicipality,
  getUnknownErrorMessage,
  toMunicipalityId,
  toTipoDocumentoId,
} from '@dashboard/services/tercero-form.helpers';

@Component({
  selector: 'app-clients-form-page',
  imports: [
    HeaderTitlePageComponent,
    FormErrorLabelComponent,
    ReactiveFormsModule,
    LoaderComponent,
    ErrorPageComponent,
    ListGroupDropdownComponent,
  ],
  templateUrl: './clients-form-page.component.html',
})
export class ClientsFormPageComponent implements OnInit {
  isModal = input<boolean>(false);
  saveSuccess = output<ClientesFormInterface>();
  notificationService = inject(NotificationService);
  cancel = output<void>();

  private fb = inject(FormBuilder);
  clienteService = inject(ClientesService);
  private cuentasService = inject(CuentasContablesService);
  router = inject(Router);
  activateRoute = inject(ActivatedRoute);
  catalogsStore = inject(CatalogsStore);
  clienteID = toSignal(
    this.activateRoute.params.pipe(map((params) => params['id'])),
  );
  headTitleCliente: HeaderInput = {
    title:
      this.clienteID() && this.clienteID() !== 'new-Item'
        ? 'Actualizar Cliente'
        : 'Guardar Cliente',
    slog:
      this.clienteID() && this.clienteID() !== 'new-Item'
        ? 'Actualiza la información del cliente'
        : 'Registra un nuevo cliente al sistema',
  };
  loading = signal<boolean>(false);

  cuentasContables = signal<GetCuentasContables[]>([]);
  cuentasFiltradas = signal<GetCuentasContables[]>([]);

  clientsForm = this.fb.group({
    nombre: new FormControl<string | null>('', Validators.required),
    apellido: new FormControl<string | null>('', Validators.required),
    tipoDocumento: new FormControl<number | string | null>(null, Validators.required),
    numeroDocumento: new FormControl<string | null>('', Validators.required),
    tipoPersona: new FormControl<string | null>('', Validators.required),
    razonSocial: new FormControl<string | null>('', Validators.required),
    direccion: new FormControl<string | null>('', Validators.required),
    ciudad: new FormControl<number | string | null>(null, Validators.required),
    telefono: new FormControl<string | null>(''),
    email: new FormControl<string | null>(''),
    observacion: new FormControl<string | null>(''),
    tributo: new FormControl<string | null>('', Validators.required),
    dv: new FormControl<string | null>(''),
    cuentaContableId: new FormControl<string | null>(null),
  });

  getCityName(): string {
    const ref = this.clientsForm.get('ciudad')?.value as number | string | null | undefined;
    return formatMunicipality(findMunicipality(this.catalogsStore.municipalities(), ref));
  }

  onCitySelect(city: Municipality): void {
    this.clientsForm.patchValue({ ciudad: city.id });
  }

  clienteIdResource = rxResource({
    request: () => {
      if (this.isModal()) {
        return null;
      }
      return { id: this.clienteID() };
    },
    loader: ({ request }) => {
      if (!request) {
        return this.clienteService.getClientesById('new-Item');
      }

      return this.clienteService
        .getClientesById(request.id)
        .pipe(tap((el) => this.clientsForm.reset(el)));
    },
  });

  async ngOnInit() {
    this.clientsForm.get('tipoPersona')?.valueChanges.subscribe((value) => {
      if (!value) return;
      this.toggleValidations(value);
    });

    this.clientsForm.get('tipoDocumento')?.valueChanges.subscribe((value) => {
      this.handleTipoDocumentoChange(value);
    });

    this.clientsForm.get('numeroDocumento')?.valueChanges.subscribe((value) => {
      if (this.clientsForm.get('tipoDocumento')?.value == '6') {
        this.updateDV(value);
      }
    });

    if (this.isModal()) {
      this.clientsForm.reset();
      this.headTitleCliente.title = 'Crear Cliente';
      this.headTitleCliente.slog = 'Registra un nuevo cliente al sistema';
    }

    try {
      const accounts = await firstValueFrom(
        this.cuentasService.getCuentasContables(),
      );
      this.cuentasContables.set(accounts);
      this.cuentasFiltradas.set(filterCuentasByPrefix(accounts, '13'));
    } catch {
      this.notificationService.error('Error al cargar cuentas contables', 'Error');
    }
  }

  getCuentaContableDisplay(): string {
    const id = this.clientsForm.get('cuentaContableId')?.value as string | null;
    if (!id) return '';
    const account = this.cuentasContables().find((c) => c.id === id);
    return account ? `${account.codigo} - ${account.nombre}` : '';
  }

  onCuentaSelect(account: GetCuentasContables): void {
    this.clientsForm.patchValue({ cuentaContableId: account.id });
  }

  toggleValidations(tipo: string): void {
    applyPersonaValidations(this.clientsForm, tipo);
  }

  async onSubmit() {
    const isValid = this.clientsForm.valid;
    this.clientsForm.markAllAsTouched();

    if (!isValid) {
      this.notificationService.error('Formulario incompleto', 'Error');
      return;
    }

    this.loading.set(true);

    try {
      const raw = this.clientsForm.getRawValue();
      const formValue: Partial<ClientesFormInterface> = {
        nombre: raw.nombre ?? '',
        apellido: raw.apellido ?? '',
        tipoDocumento: toTipoDocumentoId(raw.tipoDocumento),
        numeroDocumento: raw.numeroDocumento ?? '',
        tipoPersona: raw.tipoPersona ?? '',
        razonSocial: raw.razonSocial ?? '',
        direccion: raw.direccion ?? '',
        ciudad: toMunicipalityId(raw.ciudad),
        telefono: raw.telefono?.toString() ?? '',
        email: raw.email ?? '',
        observacion: raw.observacion ?? '',
        tributo: raw.tributo ?? '',
        dv: raw.dv ?? '',
        cuentaContableId: raw.cuentaContableId ?? '',
      };

      if (this.clienteID() == 'new-Item' || this.isModal()) {
        const client = await firstValueFrom(
          this.clienteService.agregarCliente(
            formValue as Partial<ClientesFormInterface>,
          ),
        );

        if (client.success == false) {
          this.notificationService.error(
            `Hubo un error al guardar el cliente ${HelpersUtils.getMessageError(client.message)}`,
            'Error',
          );
          return;
        }

        this.notificationService.success(
          'Cliente guardado exitosamente',
          'Éxito',
        );

        if (this.isModal()) {
          this.saveSuccess.emit(client.data);
        } else {
          await this.router.navigateByUrl('/panel/ventas/clients');
        }
      } else {
        const clientUpdate = await firstValueFrom(
          this.clienteService.actualizarClientes(
            this.clienteID(),
            formValue as Partial<ClientesFormInterface>,
          ),
        );

        if (clientUpdate.success == false) {
          this.notificationService.error(
            `Hubo un error al guardar el cliente ${HelpersUtils.getMessageError(clientUpdate.message)}`,
            'Error',
          );
          return;
        }

        this.notificationService.success(
          'Cliente actualizado exitosamente',
          'Éxito',
        );
        await this.router.navigateByUrl('/panel/ventas/clients');
      }
    } catch (error: unknown) {
      this.notificationService.error(getUnknownErrorMessage(error), 'Error');
    } finally {
      this.loading.set(false);
    }
  }

  async onCancel() {
    if (this.isModal()) {
      this.cancel.emit();
    } else {
      await this.router.navigateByUrl('/panel/ventas/clients');
    }
    this.clientsForm.reset();
  }

  private handleTipoDocumentoChange(tipo: number | string | null | undefined): void {
    const dvControl = this.clientsForm.get('dv');
    if (String(tipo ?? '') === '6') {
      // NIT
      dvControl?.setValidators([Validators.required]);
      this.updateDV(this.clientsForm.get('numeroDocumento')?.value);
    } else {
      dvControl?.clearValidators();
      dvControl?.setValue('');
    }
    dvControl?.updateValueAndValidity();
  }

  private updateDV(nit: string | null | undefined): void {
    if (!nit) {
      this.clientsForm.get('dv')?.setValue('');
      return;
    }
    this.clientsForm.get('dv')?.setValue(calculateNitDv(nit));
  }
}
