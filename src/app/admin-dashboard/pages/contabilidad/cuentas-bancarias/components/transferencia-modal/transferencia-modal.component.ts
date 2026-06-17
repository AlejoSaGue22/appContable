import { Component, EventEmitter, Input, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CuentasBancariasService } from '../../../services/cuentas-bancarias.service';
import { CuentaBancaria } from '../../../interfaces/cuenta-bancaria.interface';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';

@Component({
 selector: 'app-transferencia-modal',
 standalone: true,
 imports: [CommonModule, ReactiveFormsModule],
 templateUrl: './transferencia-modal.component.html'
})
export class TransferenciaModalComponent implements OnInit {
 private fb = inject(FormBuilder);
 private cuentasService = inject(CuentasBancariasService);
 private notificationService = inject(NotificationService);
 private loaderService = inject(LoaderService);

 @Input() isOpen = false;
 @Input() cuentas: CuentaBancaria[] = [];
 @Output() close = new EventEmitter<void>();
 @Output() submit = new EventEmitter<void>();

 form: FormGroup = this.fb.group({
 cuentaOrigenId: ['', [Validators.required]],
 cuentaDestinoId: ['', [Validators.required]],
 monto: [null, [Validators.required, Validators.min(0.01)]],
 observaciones: ['', [Validators.maxLength(500)]]
 }, { validators: this.cuentasDiferentesValidator });

 isSubmitting = signal(false);

 ngOnInit() {
 }

 cuentasDiferentesValidator(group: AbstractControl): ValidationErrors | null {
 const origen = group.get('cuentaOrigenId')?.value;
 const destino = group.get('cuentaDestinoId')?.value;
 if (origen && destino && origen === destino) {
 return { mismasCuentas: true };
 }
 return null;
 }

 onSubmit() {
 if (this.form.invalid) {
 this.form.markAllAsTouched();
 this.notificationService.error('Por favor, complete el formulario correctamente');
 return;
 }

 this.isSubmitting.set(true);
 this.loaderService.show();
 
 this.cuentasService.transferir(this.form.getRawValue()).subscribe({
 next: () => {
 this.notificationService.success('Transferencia realizada con éxito');
 this.submit.emit();
 this.isSubmitting.set(false);
 },
 error: (err) => {
 this.notificationService.error('Error al realizar la transferencia', err);
 this.isSubmitting.set(false);
 },
 complete: () => {
 this.loaderService.hide();
 }
 });
 }

 onClose() {
 this.form.reset({ monto: null });
 this.close.emit();
 }
}
