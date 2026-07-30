import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NominaService } from '../services/nomina.service';
import { ParametroNominaVersion } from '../interfaces/nomina.interface';
import { HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';

@Component({
  selector: 'app-configuracion-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, CurrencyPipe, HeaderTitlePageComponent],
  templateUrl: './configuracion-page.component.html',
})
export default class ConfiguracionPageComponent implements OnInit {
  private nominaService = inject(NominaService);
  private notification = inject(NotificationService);
  private loader = inject(LoaderService);
  private fb = inject(FormBuilder);

  headTitle = {
    title: 'Parametrización Legal de Nómina',
    slog: 'Configuración versionada de SMMLV, auxilio de transporte y tarifas de seguridad social',
  };

  parametroVigente = signal<ParametroNominaVersion | null>(null);
  historialParametros = signal<ParametroNominaVersion[]>([]);
  loading = signal(true);
  showModal = signal(false);

  form: FormGroup = this.fb.group({
    anio: [new Date().getFullYear(), [Validators.required, Validators.min(2000)]],
    fechaInicioVigencia: [new Date().toISOString().split('T')[0], Validators.required],
    smmlv: [1423500, [Validators.required, Validators.min(1)]],
    auxilioTransporte: [200000, [Validators.required, Validators.min(0)]],
    porcentajeSaludEmpleado: [4.0, [Validators.required, Validators.min(0)]],
    porcentajePensionEmpleado: [4.0, [Validators.required, Validators.min(0)]],
    porcentajeSaludEmpresa: [8.5, [Validators.required, Validators.min(0)]],
    porcentajePensionEmpresa: [12.0, [Validators.required, Validators.min(0)]],
    porcentajeCcf: [4.0, [Validators.required, Validators.min(0)]],
    porcentajeSena: [2.0, [Validators.required, Validators.min(0)]],
    porcentajeIcbf: [3.0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      // API call to backend
      const res = await this.nominaService.getParametrosVigentes().toPromise();
      this.parametroVigente.set(res || null);
    } catch (err: any) {
      this.notification.error('Error al cargar parámetros legales', err?.message);
    } finally {
      this.loading.set(false);
    }
  }

  openNewModal() {
    this.form.patchValue({
      anio: new Date().getFullYear(),
      fechaInicioVigencia: new Date().toISOString().split('T')[0],
      smmlv: this.parametroVigente()?.smmlv || 1423500,
      auxilioTransporte: this.parametroVigente()?.auxilioTransporte || 200000,
      porcentajeSaludEmpleado: 4.0,
      porcentajePensionEmpleado: 4.0,
      porcentajeSaludEmpresa: 8.5,
      porcentajePensionEmpresa: 12.0,
      porcentajeCcf: 4.0,
      porcentajeSena: 2.0,
      porcentajeIcbf: 3.0,
    });
    this.showModal.set(true);
  }

  closeModal() {
    this.showModal.set(false);
  }

  async onSubmit() {
    if (this.form.invalid) {
      this.notification.error('Por favor complete todos los campos obligatorios');
      return;
    }

    this.loader.show();
    try {
      await this.nominaService.createParametroVersion(this.form.value).toPromise();
      this.notification.success('Nueva versión de parámetros legales guardada exitosamente');
      this.closeModal();
      this.loadData();
    } catch (err: any) {
      this.notification.error('Error al guardar parámetros legales', err?.message);
    } finally {
      this.loader.hide();
    }
  }
}
