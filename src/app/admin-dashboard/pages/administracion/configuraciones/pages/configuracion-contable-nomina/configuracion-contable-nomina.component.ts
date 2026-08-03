import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  HeaderInput,
  HeaderTitlePageComponent,
} from '@dashboard/components/header-title-page/header-title-page.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';
import { CuentasContablesService } from '@dashboard/pages/contabilidad/services/cuentas-contables.service';
import { NominaService } from '@dashboard/pages/nomina/services/nomina.service';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';
import { firstValueFrom } from 'rxjs';
import { ConceptoNomina } from '@dashboard/pages/nomina/interfaces/nomina.interface';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-configuracion-contable-nomina',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    HeaderTitlePageComponent,
    BreadcrumbComponent,
  ],
  templateUrl: './configuracion-contable-nomina.component.html',
})
export class ConfiguracionContableNominaComponent implements OnInit {
  titleHead: HeaderInput = {
    title: 'Configuración Contable de Nómina',
    slog: 'Parametrización de cuentas contables para egresos de nómina por áreas',
  };

  breadcrumbItems = [
    { label: 'Configuración', route: '/panel/admin/settings' },
    { label: 'Configuración Contable de Nómina' },
  ];

  private fb = inject(FormBuilder);
  private nominaService = inject(NominaService);
  private cuentasService = inject(CuentasContablesService);
  private notificationService = inject(NotificationService);
  private loader = inject(LoaderService);

  // States
  activeTab = signal<'ADMINISTRATIVA' | 'OPERATIVA' | 'VENTAS'>('ADMINISTRATIVA');
  cuentas = signal<any[]>([]);
  conceptos = signal<ConceptoNomina[]>([]);
  isLoading = signal<boolean>(true);
  isSaving = signal<boolean>(false);

  // Card edit/collapse state
  editingDevengados = signal<boolean>(false);
  editingDeducciones = signal<boolean>(false);
  editingAportes = signal<boolean>(false);
  editingNoExonerados = signal<boolean>(false);
  editingProvisiones = signal<boolean>(false);

  collapsedDevengados = signal<boolean>(false);
  collapsedDeducciones = signal<boolean>(false);
  collapsedAportes = signal<boolean>(false);
  collapsedNoExonerados = signal<boolean>(false);
  collapsedProvisiones = signal<boolean>(false);

  private devengadosBackup: any = null;
  private deduccionesBackup: any = null;
  private deduccionesTrabajadorBackup: any = null;
  private aportesBackup: any = null;
  private noExoneradosBackup: any = null;
  private provisionesBackup: any = null;

  // Filtered accounts for selections
  cuentasGastos = computed(() => {
    return this.cuentas().filter(
      (c) => c.aceptaMovimiento && (c.codigo.startsWith('5') || c.codigo.startsWith('6') || c.codigo.startsWith('7')),
    );
  });

  cuentasPasivos = computed(() => {
    return this.cuentas().filter(
      (c) => c.aceptaMovimiento && c.codigo.startsWith('2'),
    );
  });

  // Filtered concepts by type
  conceptosDevengados = computed(() => this.conceptos().filter(c => c.tipo === 'DEVENGADO'));
  conceptosDeducciones = computed(() => this.conceptos().filter(c => c.tipo === 'DEDUCCION'));

  // Main nested form group
  form: FormGroup = this.fb.group({
    ADMINISTRATIVA: this.createAreaFormGroup(),
    OPERATIVA: this.createAreaFormGroup(),
    VENTAS: this.createAreaFormGroup(),
  });

  createAreaFormGroup(): FormGroup {
    return this.fb.group({
      conceptos: this.fb.group({
        salario: this.fb.group({ cuentaId: [null] }),
        auxilioTransporte: this.fb.group({ cuentaId: [null] }),
      }),
      deduccionesTrabajador: this.fb.group({
        salud: this.fb.group({ cuentaPasivoId: [null] }),
        pension: this.fb.group({ cuentaPasivoId: [null] }),
      }),
      aportesEmpleador: this.fb.group({
        pension: this.fb.group({ cuentaGastoId: [null], cuentaPasivoId: [null] }),
        arl: this.fb.group({ cuentaGastoId: [null], cuentaPasivoId: [null] }),
        ccf: this.fb.group({ cuentaGastoId: [null], cuentaPasivoId: [null] }),
        saludPatronal: this.fb.group({ cuentaGastoId: [null], cuentaPasivoId: [null] }),
        sena: this.fb.group({ cuentaGastoId: [null], cuentaPasivoId: [null] }),
        icbf: this.fb.group({ cuentaGastoId: [null], cuentaPasivoId: [null] }),
      }),
      provisiones: this.fb.group({
        prima: this.fb.group({ cuentaGastoId: [null], cuentaPasivoId: [null] }),
        cesantias: this.fb.group({ cuentaGastoId: [null], cuentaPasivoId: [null] }),
        interesesCesantias: this.fb.group({ cuentaGastoId: [null], cuentaPasivoId: [null] }),
        vacaciones: this.fb.group({ cuentaGastoId: [null], cuentaPasivoId: [null] }),
      }),
      cajaBanco: this.fb.group({
        cuentaObligacionesLabId: [null],
      })
    });
  }

  get activeAreaForm(): FormGroup {
    return this.form.get(this.activeTab()) as FormGroup;
  }

  ngOnInit(): void {
    this.loadData();
  }

  async loadData() {
    this.isLoading.set(true);
    this.loader.show();
    try {
      // 1. Load accounts catalogue
      const accounts = await firstValueFrom(this.cuentasService.getCuentasContables());
      this.cuentas.set(accounts || []);

      // 2. Load concepts
      const concepts = await firstValueFrom(this.nominaService.getConceptos());
      this.conceptos.set(concepts || []);

      // Add dynamic concept controls to the form
      const areas: ('ADMINISTRATIVA' | 'OPERATIVA' | 'VENTAS')[] = ['ADMINISTRATIVA', 'OPERATIVA', 'VENTAS'];
      for (const area of areas) {
        const conceptosGroup = this.form.get(`${area}.conceptos`) as FormGroup;
        for (const c of this.conceptos()) {
          if (!conceptosGroup.contains(c.id)) {
            conceptosGroup.addControl(c.id, this.fb.group({ cuentaId: [null] }));
          }
        }
      }

      // 3. Load configurations from server
      const config = await firstValueFrom(this.nominaService.getConfiguracionesContables());
      if (config) {
        this.form.patchValue(config);
      }
    } catch (e) {
      this.notificationService.error('Error al cargar la información contable');
    } finally {
      this.isLoading.set(false);
      this.loader.hide();
    }
  }

  changeTab(tab: 'ADMINISTRATIVA' | 'OPERATIVA' | 'VENTAS') {
    // Reset all edit modes when changing tab
    this.cancelEditDevengados();
    this.cancelEditDeducciones();
    this.cancelEditAportes();
    this.cancelEditNoExonerados();
    this.cancelEditProvisiones();
    this.activeTab.set(tab);
  }

  // Account display utility
  getAccountDisplay(cuentaId: string | null): string {
    if (!cuentaId) return '-';
    const acc = this.cuentas().find(c => c.id === cuentaId);
    return acc ? `${acc.codigo} - ${acc.nombre}` : '-';
  }

  // ── Card Edit/Collapse Methods ───────────────────────────────────
  toggleCollapseDevengados() { this.collapsedDevengados.update(v => !v); }
  toggleCollapseDeducciones() { this.collapsedDeducciones.update(v => !v); }
  toggleCollapseAportes() { this.collapsedAportes.update(v => !v); }
  toggleCollapseNoExonerados() { this.collapsedNoExonerados.update(v => !v); }
  toggleCollapseProvisiones() { this.collapsedProvisiones.update(v => !v); }

  // ── Devengados ───────────────────────────────────
  startEditDevengados() {
    const area = this.activeTab();
    this.devengadosBackup = (this.form.get(`${area}.conceptos`) as FormGroup).getRawValue();
    this.editingDevengados.set(true);
    this.collapsedDevengados.set(false);
  }

  cancelEditDevengados() {
    if (this.devengadosBackup) {
      const area = this.activeTab();
      (this.form.get(`${area}.conceptos`) as FormGroup).patchValue(this.devengadosBackup);
      this.devengadosBackup = null;
    }
    this.editingDevengados.set(false);
  }

  // ── Deducciones (includes deduccionesTrabajador + conceptos DEDUCCION) ───
  startEditDeducciones() {
    const area = this.activeTab();
    this.deduccionesBackup = (this.form.get(`${area}.conceptos`) as FormGroup).getRawValue();
    this.deduccionesTrabajadorBackup = (this.form.get(`${area}.deduccionesTrabajador`) as FormGroup).getRawValue();
    this.editingDeducciones.set(true);
    this.collapsedDeducciones.set(false);
  }

  cancelEditDeducciones() {
    const area = this.activeTab();
    if (this.deduccionesBackup) {
      (this.form.get(`${area}.conceptos`) as FormGroup).patchValue(this.deduccionesBackup);
      this.deduccionesBackup = null;
    }
    if (this.deduccionesTrabajadorBackup) {
      (this.form.get(`${area}.deduccionesTrabajador`) as FormGroup).patchValue(this.deduccionesTrabajadorBackup);
      this.deduccionesTrabajadorBackup = null;
    }
    this.editingDeducciones.set(false);
  }

  // ── Aportes del Empleador (Obligatorios) ───────────────────
  startEditAportes() {
    const area = this.activeTab();
    this.aportesBackup = (this.form.get(`${area}.aportesEmpleador`) as FormGroup).getRawValue();
    this.editingAportes.set(true);
    this.collapsedAportes.set(false);
  }

  cancelEditAportes() {
    if (this.aportesBackup) {
      const area = this.activeTab();
      (this.form.get(`${area}.aportesEmpleador`) as FormGroup).patchValue(this.aportesBackup);
      this.aportesBackup = null;
    }
    this.editingAportes.set(false);
  }

  // ── Aportes No Exonerados ───────────────────────────
  startEditNoExonerados() {
    const area = this.activeTab();
    this.noExoneradosBackup = (this.form.get(`${area}.aportesEmpleador`) as FormGroup).getRawValue();
    this.editingNoExonerados.set(true);
    this.collapsedNoExonerados.set(false);
  }

  cancelEditNoExonerados() {
    if (this.noExoneradosBackup) {
      const area = this.activeTab();
      (this.form.get(`${area}.aportesEmpleador`) as FormGroup).patchValue(this.noExoneradosBackup);
      this.noExoneradosBackup = null;
    }
    this.editingNoExonerados.set(false);
  }

  // ── Provisiones ────────────────────────────────────
  startEditProvisiones() {
    const area = this.activeTab();
    this.provisionesBackup = (this.form.get(`${area}.provisiones`) as FormGroup).getRawValue();
    this.editingProvisiones.set(true);
    this.collapsedProvisiones.set(false);
  }

  cancelEditProvisiones() {
    if (this.provisionesBackup) {
      const area = this.activeTab();
      (this.form.get(`${area}.provisiones`) as FormGroup).patchValue(this.provisionesBackup);
      this.provisionesBackup = null;
    }
    this.editingProvisiones.set(false);
  }

  // ── Helpers ───────────────────────────────────────
  /** Get the cuentaId assigned to a concept (fixed key or dynamic uuid) */
  getConceptoCuentaId(key: string): string | null {
    const area = this.activeTab();
    const group = this.form.get(`${area}.conceptos.${key}`) as FormGroup;
    return group?.get('cuentaId')?.value || null;
  }

  /** Clear assigned account for a dynamic concept */
  clearConceptoCuenta(conceptoId: string) {
    const area = this.activeTab();
    const group = this.form.get(`${area}.conceptos.${conceptoId}`) as FormGroup;
    if (group) {
      group.get('cuentaId')?.setValue(null);
    }
  }

  /** Get a form value from any section path */
  getFormValue(sectionPath: string, controlName: string): string | null {
    const area = this.activeTab();
    const group = this.form.get(`${area}.${sectionPath}`);
    return group?.get(controlName)?.value || null;
  }

  async save() {
    if (this.form.invalid) {
      this.notificationService.error('Complete el formulario correctamente.');
      return;
    }

    this.isSaving.set(true);
    this.loader.show();
    
    try {
      const area = this.activeTab();
      const configuracion = this.form.get(area)?.value;

      // Map values with codes and names for the backend JSON column
      if (configuracion.conceptos) {
        Object.keys(configuracion.conceptos).forEach(key => {
          const cId = configuracion.conceptos[key].cuentaId;
          const matched = this.cuentas().find(c => c.id === cId);
          configuracion.conceptos[key] = {
            cuentaId: cId,
            codigo: matched?.codigo || null,
            nombre: matched?.nombre || null
          };
        });
      }

      // Deducciones del trabajador mapping details
      if (configuracion.deduccionesTrabajador) {
        Object.keys(configuracion.deduccionesTrabajador).forEach(key => {
          const item = configuracion.deduccionesTrabajador[key];
          const pasivoAcc = this.cuentas().find(c => c.id === item.cuentaPasivoId);
          configuracion.deduccionesTrabajador[key] = {
            cuentaPasivoId: item.cuentaPasivoId,
            cuentaPasivoCodigo: pasivoAcc?.codigo || null,
            cuentaPasivoNombre: pasivoAcc?.nombre || null,
          };
        });
      }

      // Aportes empleador mapping details
      if (configuracion.aportesEmpleador) {
        Object.keys(configuracion.aportesEmpleador).forEach(key => {
          const item = configuracion.aportesEmpleador[key];
          const gastoAcc = this.cuentas().find(c => c.id === item.cuentaGastoId);
          const pasivoAcc = this.cuentas().find(c => c.id === item.cuentaPasivoId);
          configuracion.aportesEmpleador[key] = {
            cuentaGastoId: item.cuentaGastoId,
            cuentaGastoCodigo: gastoAcc?.codigo || null,
            cuentaGastoNombre: gastoAcc?.nombre || null,
            cuentaPasivoId: item.cuentaPasivoId,
            cuentaPasivoCodigo: pasivoAcc?.codigo || null,
            cuentaPasivoNombre: pasivoAcc?.nombre || null,
          };
        });
      }

      // Provisiones mapping details
      if (configuracion.provisiones) {
        Object.keys(configuracion.provisiones).forEach(key => {
          const item = configuracion.provisiones[key];
          const gastoAcc = this.cuentas().find(c => c.id === item.cuentaGastoId);
          const pasivoAcc = this.cuentas().find(c => c.id === item.cuentaPasivoId);
          configuracion.provisiones[key] = {
            cuentaGastoId: item.cuentaGastoId,
            cuentaGastoCodigo: gastoAcc?.codigo || null,
            cuentaGastoNombre: gastoAcc?.nombre || null,
            cuentaPasivoId: item.cuentaPasivoId,
            cuentaPasivoCodigo: pasivoAcc?.codigo || null,
            cuentaPasivoNombre: pasivoAcc?.nombre || null,
          };
        });
      }

      // General liability details
      if (configuracion.cajaBanco) {
        const item = configuracion.cajaBanco;
        const matched = this.cuentas().find(c => c.id === item.cuentaObligacionesLabId);
        configuracion.cajaBanco = {
          cuentaObligacionesLabId: item.cuentaObligacionesLabId,
          cuentaObligacionesLabCodigo: matched?.codigo || null,
          cuentaObligacionesLabNombre: matched?.nombre || null,
        };
      }

      await firstValueFrom(this.nominaService.saveConfiguracionContable(area, configuracion));
      this.notificationService.success(`Configuración contable de área ${area.toLowerCase()} guardada exitosamente`);
      
      // Reload configurations
      const config = await firstValueFrom(this.nominaService.getConfiguracionesContables());
      if (config) {
        this.form.patchValue(config);
      }
    } catch (e: any) {
      this.notificationService.error(e?.message || 'Error al guardar la configuración contable');
    } finally {
      this.isSaving.set(false);
      this.loader.hide();
    }
  }
}
