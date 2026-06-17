import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { CuentasContablesService } from '@dashboard/pages/contabilidad/services/cuentas-contables.service';
import { NotificationService } from '@shared/services/notification.service';
import { firstValueFrom } from 'rxjs';
import { ParametrizacionContableService } from './services/parametrizacion-contable.service';

@Component({
 selector: 'app-parametrizacion-contable',
 standalone: true,
 imports: [CommonModule, ReactiveFormsModule, HeaderTitlePageComponent],
 templateUrl: './parametrizacion-contable.html',
})
export class ParametrizacionContable implements OnInit {
 titleHead: HeaderInput = {
 title: 'Parametrización Contable',
 slog: 'Configura las cuentas contables de la empresa'
 };

 private fb = inject(FormBuilder);
 private parametrizacionService = inject(ParametrizacionContableService);
 private cuentasService = inject(CuentasContablesService);
 private notificationService = inject(NotificationService);

 cuentas = signal<any[]>([]);
 cuentasFiltradasClientes = computed(() => {
 return this.cuentas().filter(c => c.aceptaMovimiento && c.codigo.startsWith('13'));
 });

 cuentasFiltradasIva = computed(() => {
 return this.cuentas().filter(c => c.aceptaMovimiento && c.codigo.startsWith('2408'));
 });

 cuentasFiltradasProveedores = computed(() => {
 return this.cuentas().filter(c => c.aceptaMovimiento && c.codigo.startsWith('22'));
 });
 
 isSaving = signal<boolean>(false);

 paramForm: FormGroup = this.fb.group({
 cuentaCobrarClientesId: [null],
 cuentaDevolucionesClientesId: [null],
 cuentaPagarProveedoresId: [null],
 cuentaDevolucionesProveedoresId: [null],
 cuentaDevolucionIvaComprasId: [null]
 });

 ngOnInit(): void {
 this.loadData();
 }

 async loadData() {
 try {
 // Cargar cuentas contables
 const cuentasData = await firstValueFrom(this.cuentasService.getCuentasContables());
 this.cuentas.set(cuentasData);

 // Cargar configuración actual
 const config = await firstValueFrom(this.parametrizacionService.getConfiguracion());
 if (config) {
 this.paramForm.patchValue({
 cuentaCobrarClientesId: config.cuentaCobrarClientesId || null,
 cuentaDevolucionesClientesId: config.cuentaDevolucionesClientesId || null,
 cuentaPagarProveedoresId: config.cuentaPagarProveedoresId || null,
 cuentaDevolucionesProveedoresId: config.cuentaDevolucionesProveedoresId || null,
 cuentaDevolucionIvaComprasId: config.cuentaDevolucionIvaComprasId || null
 });
 }
 } catch (error) {
 this.notificationService.error('Error al cargar la información', 'Error');
 }
 }

 async save() {
 if (this.paramForm.invalid) return;

 this.isSaving.set(true);
 const data = this.paramForm.value;
 try {
 await firstValueFrom(this.parametrizacionService.updateConfiguracion(data));
 this.notificationService.success('Configuración contable actualizada exitosamente', 'Éxito');
 } catch (error: any) {
 this.notificationService.error(error?.error?.message || 'Error al guardar la configuración', 'Error');
 } finally {
 this.isSaving.set(false);
 }
 }
}
