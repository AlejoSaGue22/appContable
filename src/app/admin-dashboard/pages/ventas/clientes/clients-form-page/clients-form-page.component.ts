import { Component, inject, OnInit, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { FormErrorLabelComponent } from "src/app/utils/components/form-error-label/form-error-label.component";
import { ClientesService } from '../../services/clientes.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientesInterface, Municipality } from '@dashboard/interfaces/clientes-interface';
import { firstValueFrom, map, tap } from 'rxjs';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { LoaderComponent } from "src/app/utils/components/loader/loader.component";
import { ErrorPageComponent } from "src/app/utils/components/error-page/error-page.component";
import { NotificationService } from '@shared/services/notification.service';


@Component({
    selector: 'app-clients-form-page',
    imports: [HeaderTitlePageComponent, FormErrorLabelComponent, ReactiveFormsModule, LoaderComponent, ErrorPageComponent],
    templateUrl: './clients-form-page.component.html',
})
export class ClientsFormPageComponent implements OnInit {

    isModal = input<boolean>(false);
    saveSuccess = output<ClientesInterface>();
    notificationService = inject(NotificationService);
    cancel = output<void>();
    municipalities = signal<Municipality[]>([]);

    private fb = inject(FormBuilder);
    clienteService = inject(ClientesService);
    router = inject(Router);
    activateRoute = inject(ActivatedRoute);
    headTitleCliente: HeaderInput = { title: 'Crear Cliente', slog: 'Registra un nuevo cliente al sistema' };

    clientsForm = this.fb.group({
        nombre: ['', Validators.required],
        apellido: ['', Validators.required],
        tipoDocumento: ['', Validators.required],
        numeroDocumento: ['', Validators.required],
        tipoPersona: ['', Validators.required],
        razonSocial: ['', Validators.required],
        direccion: ['', Validators.required],
        ciudad: ['', Validators.required],
        telefono: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10)]],
        email: ['', Validators.required],
        observacion: [''],
        tributo: ['', Validators.required],
        responsableFiscal: ['', Validators.required],
        dv: [''],
    })

    clienteID = toSignal(
        this.activateRoute.params.pipe(map((params) => params['id']))
    )

    clienteIdResource = rxResource({
        request: () => {
            // Solo cargar si NO está en modo modal
            if (this.isModal()) {
                return null;
            }
            return { id: this.clienteID() };
        },
        loader: ({ request }) => {
            if (!request) {
                // Si no hay request (modo modal), retornar un observable vacío
                return this.clienteService.getClientesById('new-Item');
            }
            return this.clienteService.getClientesById(request.id).pipe(
                tap((el) => this.clientsForm.reset(el))
            );
        }
    })

    ngOnInit() {
        this.loadMunicipalities();
        this.clientsForm.get('tipoPersona')?.valueChanges.subscribe(value => {
            if (!value) return;
            this.toggleValidations(value);
        });

        this.clientsForm.get('tipoDocumento')?.valueChanges.subscribe(value => {
            this.handleTipoDocumentoChange(value);
        });

        this.clientsForm.get('numeroDocumento')?.valueChanges.subscribe(value => {
            if (this.clientsForm.get('tipoDocumento')?.value === '6') {
                this.updateDV(value);
            }
        });

        if (this.isModal()) {
            this.clientsForm.reset();
            this.headTitleCliente.title = 'Crear Cliente';
            this.headTitleCliente.slog = 'Registra un nuevo cliente al sistema';
        }
    }

    toggleValidations(tipo: string) {
        const nombreControl = this.clientsForm.get('nombre');
        const apellidoControl = this.clientsForm.get('apellido');
        const razonSocialControl = this.clientsForm.get('razonSocial');

        if (tipo === 'PN') {
            nombreControl?.setValidators([Validators.required]);
            apellidoControl?.setValidators([Validators.required]);
            razonSocialControl?.clearValidators();

        } else if (tipo === 'PJ') {
            // Si el tipo es 'juridica', se requiere 'razonSocial'
            razonSocialControl?.setValidators([Validators.required]);
            nombreControl?.clearValidators();
            apellidoControl?.clearValidators();
        }

        nombreControl?.updateValueAndValidity();
        apellidoControl?.updateValueAndValidity();
        razonSocialControl?.updateValueAndValidity();
    }


    async onSubmit() {
        const isValid = this.clientsForm.valid;
        this.clientsForm.markAllAsTouched();

        if (!isValid) {
            this.notificationService.error('Formulario incompleto', 'Error');
            return;
        }

        try {

            const formValue = {
                ...this.clientsForm.value,
                telefono: this.clientsForm.get("telefono")?.value?.toString()
            };

            if (this.clienteID() == 'new-Item' || this.isModal()) {
                const client = await firstValueFrom(this.clienteService.agregarCliente(formValue as Partial<ClientesInterface>));

                if (client.success == false) {
                    console.log(client.error);
                    this.notificationService.error(`Hubo un error al guardar el cliente ${client.error.message}`, 'Error');
                    return;
                }

                this.notificationService.success("Cliente guardado exitosamente", 'Éxito');

                if (this.isModal()) {
                    this.saveSuccess.emit(client.data);
                } else {
                    await this.router.navigateByUrl('/panel/ventas/clients');
                }

            } else {
                const clientUpdate = await firstValueFrom(
                    this.clienteService.actualizarClientes(this.clienteID(), formValue as Partial<ClientesInterface>)
                );

                if (clientUpdate.success == false) {
                    this.notificationService.error(`Hubo un error al guardar el cliente ${clientUpdate.error.message}`, 'Error');
                    return;
                }

                this.notificationService.success("Cliente actualizado exitosamente", 'Éxito');
                await this.router.navigateByUrl('/panel/ventas/clients');
            }

        } catch (error: any) {
            this.notificationService.error(error.message, 'Error');
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

    private loadMunicipalities() {
        this.clienteService.getMunicipalities().subscribe(data => {
            this.municipalities.set(data);
        });
    }

    private handleTipoDocumentoChange(tipo: string | null | undefined) {
        const dvControl = this.clientsForm.get('dv');
        if (tipo === '6') { // NIT
            dvControl?.setValidators([Validators.required]);
            this.updateDV(this.clientsForm.get('numeroDocumento')?.value);
        } else {
            dvControl?.clearValidators();
            dvControl?.setValue('');
        }
        dvControl?.updateValueAndValidity();
    }

    private updateDV(nit: string | null | undefined) {
        if (!nit) {
            this.clientsForm.get('dv')?.setValue('');
            return;
        }
        const dv = this.calculateDV(nit);
        this.clientsForm.get('dv')?.setValue(dv);
    }

    private calculateDV(nit: string): string {
        const vpri = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
        const z = nit.length;
        let x = 0;
        let y = 0;

        for (let i = 0; i < z; i++) {
            y = parseInt(nit.substr(i, 1));
            x += y * vpri[z - 1 - i];
        }

        y = x % 11;
        if (y > 1) {
            return (11 - y).toString();
        } else {
            return y.toString();
        }
    }

}
