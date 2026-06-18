import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NominaService } from '../../../services/nomina.service';
import { Empleado, EntidadSeguridadSocial, Cargo, CentroCosto } from '../../../interfaces/nomina.interface';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';

@Component({
    selector: 'app-empleado-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './empleado-form.component.html',
})
export class EmpleadoFormComponent implements OnInit {
    private fb = inject(FormBuilder);
    private nominaService = inject(NominaService);
    private notification = inject(NotificationService);
    private loader = inject(LoaderService);

    empleado = input<Empleado | null>(null);
    saved = output<Empleado>();
    cancelled = output<void>();

    form = this.fb.group({
        tipoDocumento: ['CC', Validators.required],
        numeroDocumento: ['', Validators.required],
        primerNombre: ['', Validators.required],
        segundoNombre: [''],
        primerApellido: ['', Validators.required],
        segundoApellido: [''],
        email: [''],
        telefono: [''],
        direccion: [''],
        tipoContrato: ['FIJO', Validators.required],
        cargoId: [''],
        centroCostoId: [''],
        salarioBase: [0, [Validators.required, Validators.min(1)]],
        fechaIngreso: ['', Validators.required],
        fechaRetiro: [''],
        salarioIntegral: [false],
        auxilioTransporte: [false],
        epsId: ['', Validators.required],
        afpId: ['', Validators.required],
        ccfId: [''],
        arlNivelRiesgo: [1],
    });

    isSubmitting = signal(false);
    entidadesEPS = signal<EntidadSeguridadSocial[]>([]);
    entidadesAFP = signal<EntidadSeguridadSocial[]>([]);
    entidadesCCF = signal<EntidadSeguridadSocial[]>([]);
    cargos = signal<Cargo[]>([]);
    centrosCosto = signal<CentroCosto[]>([]);

    get editando(): boolean { return !!this.empleado(); }
    
    ngOnInit() {
        this.loader.show();
        this.nominaService.getEntidadesSeguridad('EPS').subscribe(r => this.entidadesEPS.set(r));
        this.nominaService.getEntidadesSeguridad('AFP').subscribe(r => this.entidadesAFP.set(r));
        this.nominaService.getEntidadesSeguridad('CCF').subscribe(r => this.entidadesCCF.set(r));
        this.nominaService.getCargos().subscribe(r => this.cargos.set(r));
        this.nominaService.getCentrosCosto().subscribe(r => this.centrosCosto.set(r));

        const emp = this.empleado();
        if (emp) {
            this.form.patchValue({
                ...emp,
                fechaIngreso: emp.fechaIngreso?.split('T')[0] || '',
                fechaRetiro: emp.fechaRetiro?.split('T')[0] || '',
            });
        }
        this.loader.hide();
    }

    onSubmit() {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.notification.error('Complete el formulario correctamente');
            return;
        }
        this.isSubmitting.set(true);
        this.loader.show();
        const dto = this.form.value as any;

        const emp = this.empleado();
        const request = emp
            ? this.nominaService.updateEmpleado(emp.id, dto)
            : this.nominaService.createEmpleado(dto);

        request.subscribe({
            next: (res) => {
                this.notification.success(emp ? 'Empleado actualizado' : 'Empleado creado');
                this.saved.emit(res);
                this.isSubmitting.set(false);
                this.loader.hide();
            },
            error: () => {
                this.notification.error('Error al guardar empleado');
                this.isSubmitting.set(false);
                this.loader.hide();
            }
        });
    }

    onCancel() {
        this.cancelled.emit();
    }
}
