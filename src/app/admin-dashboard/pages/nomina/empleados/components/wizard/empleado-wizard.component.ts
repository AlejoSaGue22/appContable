import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NominaService } from '../../../services/nomina.service';
import { Empleado, EntidadSeguridadSocial, Cargo, CentroCosto } from '../../../interfaces/nomina.interface';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';

interface Step {
  numero: number;
  titulo: string;
  descripcion: string;
  icono: string;
  color: string;
  campos: string[];
}

@Component({
  selector: 'app-empleado-wizard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './empleado-wizard.component.html',
})
export class EmpleadoWizardComponent implements OnInit {
  private fb = inject(FormBuilder);
  private nominaService = inject(NominaService);
  private notification = inject(NotificationService);
  private loader = inject(LoaderService);

  empleado = input<Empleado | null>(null);
  saved = output<Empleado>();
  cancelled = output<void>();

  currentStep = signal(0);
  isSubmitting = signal(false);
  metodoPago = signal('EFECTIVO');

  entidadesEPS = signal<EntidadSeguridadSocial[]>([]);
  entidadesAFP = signal<EntidadSeguridadSocial[]>([]);
  entidadesCCF = signal<EntidadSeguridadSocial[]>([]);
  cargos = signal<Cargo[]>([]);
  centrosCosto = signal<CentroCosto[]>([]);
  tiposContrato = signal<any[]>([]);
  bancos = signal<any[]>([]);
  pasosCompletados = signal<Set<number>>(new Set());

  pasos: Step[] = [
    { numero: 0, titulo: 'Datos Personales', descripcion: 'Identificación y contacto', icono: 'user', color: 'blue', campos: ['tipoDocumento', 'numeroDocumento', 'primerNombre', 'segundoNombre', 'primerApellido', 'segundoApellido', 'email', 'telefono', 'direccion'] },
    { numero: 1, titulo: 'Contrato', descripcion: 'Información laboral', icono: 'briefcase', color: 'teal', campos: ['tipoContratoId', 'cargoId', 'centroCostoId', 'salarioBase', 'fechaIngreso', 'fechaRetiro', 'salarioIntegral', 'auxilioTransporte'] },
    { numero: 2, titulo: 'Afiliaciones', descripcion: 'Seguridad social', icono: 'shield', color: 'violet', campos: ['epsId', 'afpId', 'ccfId', 'arlNivelRiesgo'] },
    { numero: 3, titulo: 'Datos de Pago', descripcion: 'Método y cuenta bancaria', icono: 'credit-card', color: 'amber', campos: ['metodoPago', 'bancoId', 'tipoCuentaBancaria', 'numeroCuentaBancaria'] },
  ];

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
    tipoContratoId: ['', Validators.required],
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
    metodoPago: ['EFECTIVO'],
    bancoId: [''],
    tipoCuentaBancaria: [''],
    numeroCuentaBancaria: [''],
  });

  get editando(): boolean { return !!this.empleado(); }

  get pasoActual(): Step { return this.pasos[this.currentStep()]; }

  get esPrimerPaso(): boolean { return this.currentStep() === 0; }

  get esUltimoPaso(): boolean { return this.currentStep() === this.pasos.length - 1; }

  get progreso(): number { return ((this.currentStep() + 1) / this.pasos.length) * 100; }

  ngOnInit() {
    this.loader.show();
    this.nominaService.getEntidadesSeguridad('EPS').subscribe(r => this.entidadesEPS.set(r));
    this.nominaService.getEntidadesSeguridad('AFP').subscribe(r => this.entidadesAFP.set(r));
    this.nominaService.getEntidadesSeguridad('CCF').subscribe(r => this.entidadesCCF.set(r));
    this.nominaService.getCargos().subscribe(r => this.cargos.set(r));
    this.nominaService.getCentrosCosto().subscribe(r => this.centrosCosto.set(r));
    this.nominaService.getTiposContrato().subscribe(r => this.tiposContrato.set(r));
    this.nominaService.getBancos().subscribe(r => this.bancos.set(r));

    const emp = this.empleado();
    if (emp) {
      const tipos = this.tiposContrato();
      const matching = tipos.find(t => t.codigo === emp.tipoContrato);
      this.form.patchValue({
        ...emp,
        tipoContratoId: matching?.id || emp.tipoContratoId || '',
        metodoPago: emp.metodoPago || 'EFECTIVO',
        fechaIngreso: emp.fechaIngreso?.split('T')[0] || '',
        fechaRetiro: emp.fechaRetiro?.split('T')[0] || '',
      });
      this.metodoPago.set(emp.metodoPago || 'EFECTIVO');
      this.actualizarValidacionBancaria();
    }

    this.pasosCompletados.set(new Set([0]));
    this.loader.hide();
  }

  validarPaso(paso: number): boolean {
    const pasoInfo = this.pasos[paso];
    const controls = pasoInfo.campos.filter(c => this.form.get(c));
    let valido = true;
    for (const c of controls) {
      const control = this.form.get(c);
      if (control?.validator) {
        control.updateValueAndValidity({ onlySelf: true, emitEvent: false });
        if (control.invalid) valido = false;
      }
    }
    return valido;
  }

  siguientePaso() {
    if (!this.validarPaso(this.currentStep())) {
      this.form.markAllAsTouched();
      this.notification.warning('Complete todos los campos requeridos de esta sección');
      return;
    }
    const next = this.currentStep() + 1;
    const completados = this.pasosCompletados();
    completados.add(this.currentStep());
    completados.add(next);
    this.pasosCompletados.set(new Set(completados));
    this.currentStep.set(next);
  }

  pasoAnterior() {
    if (this.currentStep() > 0) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  irAPaso(paso: number) {
    if (this.pasosCompletados().has(paso) && paso <= this.currentStep() + 1) {
      this.currentStep.set(paso);
    }
  }

  onMetodoPagoChange(event: any) {
    this.metodoPago.set(event.target.value);
    this.actualizarValidacionBancaria();
  }

  private actualizarValidacionBancaria() {
    const bancoControl = this.form.get('bancoId');
    const cuentaControl = this.form.get('numeroCuentaBancaria');
    const tipoControl = this.form.get('tipoCuentaBancaria');

    if (this.metodoPago() !== 'EFECTIVO') {
      bancoControl?.setValidators([Validators.required]);
      cuentaControl?.setValidators([Validators.required]);
      tipoControl?.setValidators([Validators.required]);
    } else {
      bancoControl?.clearValidators();
      cuentaControl?.clearValidators();
      tipoControl?.clearValidators();
    }
    bancoControl?.updateValueAndValidity();
    cuentaControl?.updateValueAndValidity();
    tipoControl?.updateValueAndValidity();
  }

  onSubmit() {
    if (!this.validarPaso(this.currentStep())) {
      this.form.markAllAsTouched();
      this.notification.error('Complete el formulario correctamente');
      return;
    }
    this.isSubmitting.set(true);
    this.loader.show();
    const dto = { ...this.form.value } as any;

    if (dto.arlNivelRiesgo) {
      dto.arlNivelRiesgo = Number(dto.arlNivelRiesgo);
    }
    
    if (dto.tipoContratoId) {
      const tipoSel = this.tiposContrato().find(t => t.id === dto.tipoContratoId);
      if (tipoSel) {
        dto.tipoContrato = tipoSel.codigo;
      }
    }

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
