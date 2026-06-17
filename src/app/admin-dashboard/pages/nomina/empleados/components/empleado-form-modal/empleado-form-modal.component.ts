import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NominaService } from '../../../services/nomina.service';
import {
 Empleado, EntidadSeguridadSocial, Cargo, CentroCosto
} from '../../../interfaces/nomina.interface';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';

@Component({
 selector: 'app-empleado-form-modal',
 standalone: true,
 imports: [CommonModule, ReactiveFormsModule],
 template: `
 <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
 <div class="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
 
 <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
 <h3 class="text-xl font-bold">{{ empleado ? 'Editar' : 'Nuevo' }} Empleado</h3>
 <button (click)="onClose()" class="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center">
 <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
 </svg>
 </button>
 </div>

 <form [formGroup]="form" (ngSubmit)="onSubmit()" class="p-6 space-y-4">
 <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo Doc. <span class="text-red-500">*</span></label>
 <select formControlName="tipoDocumento" class="w-full bg-slate-50 text-sm border border-slate-200 rounded-md px-3 py-2.5">
 <option value="CC">Cédula Ciudadanía</option>
 <option value="CE">Cédula Extranjería</option>
 <option value="NIT">NIT</option>
 <option value="TI">Tarjeta Identidad</option>
 <option value="PP">Pasaporte</option>
 </select>
 </div>
 <div>
 <label class="block text-xs font-bold text-slate-500 uppercase mb-1">N° Documento <span class="text-red-500">*</span></label>
 <input type="text" formControlName="numeroDocumento" class="w-full bg-slate-50 text-sm border border-slate-200 rounded-md px-3 py-2.5">
 </div>
 <div>
 <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Primer Nombre <span class="text-red-500">*</span></label>
 <input type="text" formControlName="primerNombre" class="w-full bg-slate-50 text-sm border border-slate-200 rounded-md px-3 py-2.5">
 </div>
 <div>
 <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Segundo Nombre</label>
 <input type="text" formControlName="segundoNombre" class="w-full bg-slate-50 text-sm border border-slate-200 rounded-md px-3 py-2.5">
 </div>
 <div>
 <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Primer Apellido <span class="text-red-500">*</span></label>
 <input type="text" formControlName="primerApellido" class="w-full bg-slate-50 text-sm border border-slate-200 rounded-md px-3 py-2.5">
 </div>
 <div>
 <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Segundo Apellido</label>
 <input type="text" formControlName="segundoApellido" class="w-full bg-slate-50 text-sm border border-slate-200 rounded-md px-3 py-2.5">
 </div>
 </div>

 <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
 <input type="email" formControlName="email" class="w-full bg-slate-50 text-sm border border-slate-200 rounded-md px-3 py-2.5">
 </div>
 <div>
 <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Teléfono</label>
 <input type="text" formControlName="telefono" class="w-full bg-slate-50 text-sm border border-slate-200 rounded-md px-3 py-2.5">
 </div>
 <div class="md:col-span-2">
 <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Dirección</label>
 <input type="text" formControlName="direccion" class="w-full bg-slate-50 text-sm border border-slate-200 rounded-md px-3 py-2.5">
 </div>
 </div>

 <div class="border-t border-slate-100 pt-4">
 <p class="text-xs font-bold text-slate-400 uppercase mb-3">Información Laboral</p>
 <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div>
 <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo Contrato <span class="text-red-500">*</span></label>
 <select formControlName="tipoContrato" class="w-full bg-slate-50 text-sm border border-slate-200 rounded-md px-3 py-2.5">
 <option value="FIJO">Término Fijo</option>
 <option value="INDEFINIDO">Término Indefinido</option>
 <option value="OBRA_LABOR">Obra / Labor</option>
 <option value="APRENDIZAJE">Aprendizaje</option>
 <option value="PRESTACION">Prestación Servicios</option>
 </select>
 </div>
 <div>
 <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Cargo</label>
 <select formControlName="cargoId" class="w-full bg-slate-50 text-sm border border-slate-200 rounded-md px-3 py-2.5">
 <option value="">Seleccionar...</option>
 @for (c of cargos(); track c.id) {
 <option [value]="c.id">{{ c.nombre }}</option>
 }
 </select>
 </div>
 <div>
 <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Centro de Costo</label>
 <select formControlName="centroCostoId" class="w-full bg-slate-50 text-sm border border-slate-200 rounded-md px-3 py-2.5">
 <option value="">Seleccionar...</option>
 @for (c of centrosCosto(); track c.id) {
 <option [value]="c.id">{{ c.nombre }}</option>
 }
 </select>
 </div>
 <div>
 <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Salario Base <span class="text-red-500">*</span></label>
 <input type="number" formControlName="salarioBase" class="w-full bg-slate-50 text-sm border border-slate-200 rounded-md px-3 py-2.5" min="0">
 </div>
 <div>
 <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Ingreso <span class="text-red-500">*</span></label>
 <input type="date" formControlName="fechaIngreso" class="w-full bg-slate-50 text-sm border border-slate-200 rounded-md px-3 py-2.5">
 </div>
 <div>
 <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha Retiro</label>
 <input type="date" formControlName="fechaRetiro" class="w-full bg-slate-50 text-sm border border-slate-200 rounded-md px-3 py-2.5">
 </div>
 </div>
 <div class="flex gap-4 mt-3">
 <label class="flex items-center gap-2 text-sm">
 <input type="checkbox" formControlName="salarioIntegral" class="rounded">
 Salario Integral
 </label>
 <label class="flex items-center gap-2 text-sm">
 <input type="checkbox" formControlName="auxilioTransporte" class="rounded">
 Auxilio de Transporte
 </label>
 </div>
 </div>

 <div class="border-t border-slate-100 pt-4">
 <p class="text-xs font-bold text-slate-400 uppercase mb-3">Seguridad Social</p>
 <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div>
 <label class="block text-xs font-bold text-slate-500 uppercase mb-1">EPS <span class="text-red-500">*</span></label>
 <select formControlName="epsId" class="w-full bg-slate-50 text-sm border border-slate-200 rounded-md px-3 py-2.5">
 <option value="">Seleccionar...</option>
 @for (e of entidadesEPS(); track e.id) {
 <option [value]="e.id">{{ e.nombre }}</option>
 }
 </select>
 </div>
 <div>
 <label class="block text-xs font-bold text-slate-500 uppercase mb-1">AFP <span class="text-red-500">*</span></label>
 <select formControlName="afpId" class="w-full bg-slate-50 text-sm border border-slate-200 rounded-md px-3 py-2.5">
 <option value="">Seleccionar...</option>
 @for (a of entidadesAFP(); track a.id) {
 <option [value]="a.id">{{ a.nombre }}</option>
 }
 </select>
 </div>
 <div>
 <label class="block text-xs font-bold text-slate-500 uppercase mb-1">CCF</label>
 <select formControlName="ccfId" class="w-full bg-slate-50 text-sm border border-slate-200 rounded-md px-3 py-2.5">
 <option value="">Seleccionar...</option>
 @for (c of entidadesCCF(); track c.id) {
 <option [value]="c.id">{{ c.nombre }}</option>
 }
 </select>
 </div>
 </div>
 <div class="mt-3">
 <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Nivel de Riesgo ARL</label>
 <select formControlName="arlNivelRiesgo" class="w-full bg-slate-50 text-sm border border-slate-200 rounded-md px-3 py-2.5">
 <option [value]="1">I - Mínimo</option>
 <option [value]="2">II - Bajo</option>
 <option [value]="3">III - Medio</option>
 <option [value]="4">IV - Alto</option>
 <option [value]="5">V - Máximo</option>
 </select>
 </div>
 </div>

 <div class="flex gap-3 pt-4 border-t border-slate-100">
 <button type="button" (click)="onClose()" class="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50">
 Cancelar
 </button>
 <button type="submit" [disabled]="form.invalid || isSubmitting()" class="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
 {{ empleado ? 'Actualizar' : 'Guardar' }}
 </button>
 </div>
 </form>
 </div>
 </div>
 `
})
export class EmpleadoFormModalComponent implements OnInit {
 private fb = inject(FormBuilder);
 private nominaService = inject(NominaService);
 private notification = inject(NotificationService);
 private loader = inject(LoaderService);

 @Input() empleado: Empleado | null = null;
 @Output() close = new EventEmitter<void>();
 @Output() saved = new EventEmitter<void>();

 form: FormGroup = this.fb.group({
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
 salarioBase: [0, [Validators.required, Validators.min(0)]],
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

 ngOnInit() {
 this.loader.show();
 this.nominaService.getEntidadesSeguridad('EPS').subscribe(r => this.entidadesEPS.set(r));
 this.nominaService.getEntidadesSeguridad('AFP').subscribe(r => this.entidadesAFP.set(r));
 this.nominaService.getEntidadesSeguridad('CCF').subscribe(r => this.entidadesCCF.set(r));
 this.nominaService.getCargos().subscribe(r => this.cargos.set(r));
 this.nominaService.getCentrosCosto().subscribe(r => this.centrosCosto.set(r));

 if (this.empleado) {
 this.form.patchValue({
 ...this.empleado,
 fechaIngreso: this.empleado.fechaIngreso?.split('T')[0] || '',
 fechaRetiro: this.empleado.fechaRetiro?.split('T')[0] || '',
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
 const dto = this.form.value;

 const request = this.empleado
 ? this.nominaService.updateEmpleado(this.empleado.id, dto)
 : this.nominaService.createEmpleado(dto);

 request.subscribe({
 next: () => {
 this.saved.emit();
 this.isSubmitting.set(false);
 this.loader.hide();
 },
 error: (err) => {
 this.notification.error('Error al guardar empleado', err);
 this.isSubmitting.set(false);
 this.loader.hide();
 }
 });
 }

 onClose() {
 this.close.emit();
 }
}
