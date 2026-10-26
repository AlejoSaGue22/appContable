import { Component, DestroyRef, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, firstValueFrom, map, of, Subject, switchMap, timer } from 'rxjs';
import { FormErrorLabelComponent } from '@utils/components/form-error-label/form-error-label.component';
import { NotificationService } from '@shared/services/notification.service';
import { PrescripcionesService } from '@dashboard/pages/ventas/services/prescripciones.service';
import { ClientesService } from '@dashboard/pages/ventas/services/clientes.service';
import { Prescripcion, ProfesionalResponsable, TipoExamenPrescripcion, TipoLentePrescripcion } from '@dashboard/pages/ventas/interfaces/prescripcion.interface';
import { ClientesFormInterface, ClientesInterfaceResponse, ClientesResponse } from '@dashboard/interfaces/clientes-interface';
import { SearchableSelectComponent } from '@shared/components/searchable-select/searchable-select.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ModalComponent } from '@shared/components/modal/modal.component';
import { ClientsFormPageComponent } from '@dashboard/pages/ventas/clientes/clients-form-page/clients-form-page.component';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, SearchableSelectComponent, ModalComponent, ClientsFormPageComponent],
  templateUrl: './prescripcion-form.component.html'
})
export class PrescripcionFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly service = inject(PrescripcionesService);
  private readonly clientesService = inject(ClientesService);
  private readonly notify = inject(NotificationService);

  readonly loading = signal(false);
  readonly patients = signal<ClientesInterfaceResponse[]>([]);
  readonly professionals = signal<ProfesionalResponsable[]>([]);
  readonly tiposExamen = signal<TipoExamenPrescripcion[]>([]);
  readonly id = this.route.snapshot.paramMap.get('id');
  readonly showLensometria = signal(false);
  readonly searchingPatients = signal(false);
  readonly showCreateClientModal = signal(false);

  private readonly patientSearchTerms = new Subject<string>();
  private hasPatientSearchStarted = false;

  readonly patientsList = computed(() => {
    return this.patients().map((p) => {
      const docAbrev = p.tipoDocumentoRel?.abreviatura || (p.tipoDocumento ? String(p.tipoDocumento) : 'Doc');
      const docNum = p.numeroDocumento ? `${p.numeroDocumento}${p.dv ? '-' + p.dv : ''}` : '';
      const docLabel = docNum ? `${docAbrev}: ${docNum}` : '';
      return {
        ...p,
        documentoLabel: docLabel,
      };
    });
  });

  readonly agudezaLejanaOptions = ['20/15', '20/20', '20/25', '20/30', '20/40', '20/50', '20/70', '20/100', '20/200', 'Cuenta dedos'];
  readonly agudezaProximaOptions = ['J1', 'J2', 'J3', 'J4', '0.50M', '0.75M', '1.0M'];

  readonly form = this.fb.group({
    fechaExamen: [new Date().toISOString().substring(0, 10), Validators.required],
    clienteId: ['', Validators.required],
    profesionalId: [''],
    tipoExamenId: ['', Validators.required],
    tipoLente: ['OFTALMICO' as TipoLentePrescripcion, Validators.required],
    derecho: this.eyeGroup(),
    izquierdo: this.eyeGroup(),
    lensometriaDerecho: this.lensometryGroup(),
    lensometriaIzquierdo: this.lensometryGroup(),
    contacto: this.fb.group({
      marca: [''],
      curvaBase: [''],
      diametro: [''],
      frecuenciaReemplazo: [''],
      materialContacto: [''],
      cuidados: ['']
    }),
    usoIndicado: [''],
    material: [''],
    filtroTratamiento: [''],
    tipoLenteDescripcion: [''],
    fechaControl: [''],
    indicaciones: [''],
    observaciones: [''],
    recomendaciones: [''],
  });

  private eyeGroup() {
    return this.fb.group({
      esfera: [''],
      cilindro: [''],
      eje: [''],
      adicion: [''],
      agudezaLejana: [''],
      agudezaProxima: [''],
      prisma: [''],
      observaciones: ['']
    });
  }

  private lensometryGroup() {
    return this.fb.group({
      esfera: [''],
      cilindro: [''],
      eje: [''],
      adicion: [''],
      observaciones: ['']
    });
  }

  get client() {
    return this.patients().find((p) => p.id === this.form.get('clienteId')?.value);
  }

  get tipoDocumentoAbrev(): string {
    const c = this.client;
    if (!c) return '';
    return c.tipoDocumentoRel?.abreviatura || (c.tipoDocumento ? String(c.tipoDocumento) : '');
  }

  get tipoDocumentoDisplay(): string {
    const c = this.client;
    if (!c) return 'Seleccione paciente';
    const abrev = c.tipoDocumentoRel?.abreviatura;
    const nombre = c.tipoDocumentoRel?.nombre;
    if (abrev && nombre) {
      if (abrev.trim().toUpperCase() === nombre.trim().toUpperCase()) {
        return abrev;
      }
      return `${abrev} - ${nombre}`;
    }
    return abrev || nombre || (c.tipoDocumento ? String(c.tipoDocumento) : '---');
  }

  get numeroDocumentoDisplay(): string {
    const c = this.client;
    if (!c) return 'Seleccione paciente';
    return c.numeroDocumento ? `${c.numeroDocumento}${c.dv ? '-' + c.dv : ''}` : '---';
  }

  /** Muestra documento formateado completo y limpio: ej. 'NIT · 901422556-2' o 'C.C. · 10203040' sin duplicar */
  get documentoCompletoDisplay(): string {
    const c = this.client;
    if (!c) return 'Seleccione un paciente...';
    const abrev = c.tipoDocumentoRel?.abreviatura || (c.tipoDocumento ? String(c.tipoDocumento) : 'DOC');
    const num = c.numeroDocumento ? `${c.numeroDocumento}${c.dv ? '-' + c.dv : ''}` : '';
    if (abrev && num) return `${abrev} · ${num}`;
    return num || abrev || '---';
  }

  // ── Presets clínicos para agilizar el llenado ──
  readonly presetsDiseno = ['Monofocal', 'Progresivo HD', 'Bifocal Invisible', 'Ocupacional / Office'];
  readonly presetsUso = ['Permanente', 'Lectura / Visión Próxima', 'Pantallas / PC', 'Visión Lejana', 'Conducción'];
  readonly presetsMaterial = ['Policarbonato 1.59', 'CR-39 (Orgánico)', 'Alto Índice 1.67', 'Trivex', 'Mineral'];
  readonly presetsTratamiento = ['Antirreflejo', 'Filtro Azul (Blue UV)', 'Fotocromático Transitions', 'UV 400', 'Capa Hidrofóbica'];
  readonly presetsIndicaciones = [
    'Uso permanente en visión lejana y próxima',
    'Adaptación gradual durante los primeros 4 días',
    'Uso exclusivo para trabajo en computador y lectura',
    'No frotarse los ojos'
  ];
  readonly presetsRecomendaciones = [
    'Pausa activa: regla 20-20-20 en pantallas',
    'Uso de lágrimas artificiales lubricantes cada 6 a 8 horas',
    'Limpiar siempre los lentes con paño de microfibra y solución óptica',
    'Evitar el uso de papel o alcohol en los cristales'
  ];

  get lensType(): TipoLentePrescripcion {
    return (this.form.get('tipoLente')?.value as TipoLentePrescripcion) || 'OFTALMICO';
  }

  setTipoLente(type: TipoLentePrescripcion) {
    this.form.patchValue({ tipoLente: type });
  }

  setAgudeza(eye: 'derecho' | 'izquierdo', field: 'agudezaLejana' | 'agudezaProxima', val: string) {
    const current = this.form.get(eye)?.get(field)?.value;
    this.form.get(eye)?.get(field)?.setValue(current === val ? '' : val);
    this.form.get(eye)?.get(field)?.markAsDirty();
  }

  togglePreset(controlName: string, value: string, append = false) {
    const control = this.form.get(controlName);
    if (!control) return;
    const current = (control.value || '').trim();

    if (!append) {
      control.setValue(current.toLowerCase() === value.toLowerCase() ? '' : value);
      control.markAsDirty();
      return;
    }

    const parts = current ? current.split(/,\s*|\s*\+\s*/).map((s: string) => s.trim()).filter(Boolean) : [];
    const index = parts.findIndex((p: string) => p.toLowerCase() === value.toLowerCase());
    if (index >= 0) {
      parts.splice(index, 1);
    } else {
      parts.push(value);
    }
    control.setValue(parts.join(' + '));
    control.markAsDirty();
  }

  isPresetActive(controlName: string, value: string, append = false): boolean {
    const val = (this.form.get(controlName)?.value || '').trim();
    if (!append) return val.toLowerCase() === value.toLowerCase();
    const parts = val ? val.split(/,\s*|\s*\+\s*/).map((s: string) => s.trim().toLowerCase()) : [];
    return parts.includes(value.toLowerCase());
  }

  setControlMonths(months: number) {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    this.form.patchValue({ fechaControl: d.toISOString().substring(0, 10) });
    this.form.get('fechaControl')?.markAsDirty();
  }

  copyOdToOi() {
    const od = this.form.get('derecho')?.value;
    if (!od) return;
    this.form.patchValue({
      izquierdo: {
        esfera: od.esfera,
        cilindro: od.cilindro,
        eje: od.eje,
        adicion: od.adicion,
        agudezaLejana: od.agudezaLejana,
        agudezaProxima: od.agudezaProxima,
        prisma: od.prisma,
        observaciones: od.observaciones
      }
    });
    this.notify.info('Graduación de Ojo Derecho (OD) copiada a Ojo Izquierdo (OI)', 'Copia Clínica');
  }

  copyLensometriaToActual() {
    const ld = this.form.get('lensometriaDerecho')?.value;
    const li = this.form.get('lensometriaIzquierdo')?.value;
    if (ld) {
      this.form.patchValue({
        derecho: {
          esfera: ld.esfera,
          cilindro: ld.cilindro,
          eje: ld.eje,
          adicion: ld.adicion
        }
      });
    }
    if (li) {
      this.form.patchValue({
        izquierdo: {
          esfera: li.esfera,
          cilindro: li.cilindro,
          eje: li.eje,
          adicion: li.adicion
        }
      });
    }
    this.notify.info('Fórmula de lensometría cargada en refracción actual', 'Valores Copiados');
  }

  adjustDiopter(eye: 'derecho' | 'izquierdo', field: 'esfera' | 'cilindro' | 'adicion', delta: number) {
    const control = this.form.get(eye)?.get(field);
    if (!control) return;
    const currentVal = parseFloat(String(control.value || '0')) || 0;
    const newVal = Math.round((currentVal + delta) * 100) / 100;
    const formatted = newVal > 0 ? `+${newVal.toFixed(2)}` : newVal.toFixed(2);
    control.setValue(formatted);
    control.markAsDirty();
  }

  toggleSign(eye: 'derecho' | 'izquierdo', field: 'esfera' | 'cilindro') {
    const control = this.form.get(eye)?.get(field);
    if (!control || control.value == null || control.value === '') return;
    const currentVal = parseFloat(String(control.value)) || 0;
    const newVal = -currentVal;
    const formatted = newVal > 0 ? `+${newVal.toFixed(2)}` : newVal.toFixed(2);
    control.setValue(formatted);
    control.markAsDirty();
  }

  get hasLensometriaData(): boolean {
    const ld = this.form.get('lensometriaDerecho')?.value;
    const li = this.form.get('lensometriaIzquierdo')?.value;
    return !!(ld?.esfera || ld?.cilindro || ld?.eje || ld?.adicion || li?.esfera || li?.cilindro || li?.eje || li?.adicion);
  }

  onSearchPatient(term: string) {
    this.hasPatientSearchStarted = true;
    this.form.get('clienteId')?.setValue('');
    this.patients.set([]);
    this.searchingPatients.set(true);
    this.patientSearchTerms.next(term.trim());
  }

  openCreateClientModal(): void {
    this.showCreateClientModal.set(true);
  }

  closeCreateClientModal(): void {
    this.showCreateClientModal.set(false);
  }

  onPatientCreated(client: ClientesFormInterface): void {
    const patient = this.normalizePatient(client);
    this.patients.update((list) => [patient, ...list.filter((item) => item.id !== patient.id)]);
    this.form.patchValue({ clienteId: patient.id });
    this.showCreateClientModal.set(false);
  }

  private normalizePatient(patient: Partial<ClientesInterfaceResponse> | Partial<ClientesFormInterface>): ClientesInterfaceResponse {
    const fullName = ('fullName' in patient ? patient.fullName?.trim() : undefined)
      || patient.razonSocial?.trim()
      || `${patient.nombre || ''} ${patient.apellido || ''}`.trim();
    return { ...patient, fullName } as ClientesInterfaceResponse;
  }

  toggleLensometria() {
    this.showLensometria.update(v => !v);
  }

  async ngOnInit() {
    this.patientSearchTerms
      .pipe(
        switchMap((search) =>
          timer(300).pipe(
            switchMap(() =>
              this.clientesService.getClientes({ limit: 10, offset: 0, search: search || undefined }).pipe(
                map((response) => (response.clientes || []).map((patient) => this.normalizePatient(patient))),
                catchError((error) => {
                  this.notify.error(error?.error?.message || 'No fue posible buscar clientes', 'Error');
                  return of([] as ClientesInterfaceResponse[]);
                }),
              ),
            ),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((patients) => {
        this.patients.set(patients);
        this.searchingPatients.set(false);
      });

    try {
      const [response, types, professionals] = await Promise.all([
        firstValueFrom(this.clientesService.getClientes({ limit: 10, offset: 0 })) as Promise<ClientesResponse>,
        firstValueFrom(this.service.listTiposExamen()),
        firstValueFrom(this.service.listProfesionales()),
      ]);
      if (!this.hasPatientSearchStarted) {
        this.patients.set((response.clientes || []).map((patient) => this.normalizePatient(patient)));
      }
      this.tiposExamen.set(types.data || []);
      this.professionals.set(professionals.data || []);

      const defaultType = this.tiposExamen().find((type) => type.codigo === 'VALORACION_VISUAL');
      if (defaultType) this.form.patchValue({ tipoExamenId: defaultType.id });

      if (this.id && this.id !== 'new-prescription') {
        const result = await firstValueFrom(this.service.get(this.id));
        if (result.data?.cliente && !this.patients().some((p) => p.id === result.data.clienteId)) {
          this.patients.update((list) => [this.normalizePatient(result.data.cliente), ...list]);
        }
        if (result.data?.profesional && !this.professionals().some((p) => p.id === result.data.profesionalId)) {
          this.professionals.update((list) => [result.data.profesional!, ...list]);
        }
        if (result.data?.tipoExamenRel && !this.tiposExamen().some((t) => t.id === result.data.tipoExamenId)) {
          this.tiposExamen.update((list) => [result.data.tipoExamenRel!, ...list]);
        }
        this.fill(result.data);
      }
    } catch {
      this.notify.error('No fue posible cargar los datos de la prescripción', 'Error');
    }
  }

  private fill(item: Prescripcion) {
    this.form.patchValue({
      fechaExamen: item.fechaExamen,
      clienteId: item.clienteId,
      profesionalId: item.profesionalId || '',
      tipoExamenId: item.tipoExamenId || item.tipoExamenRel?.id || '',
      tipoLente: item.tipoLente,
      usoIndicado: item.usoIndicado || '',
      material: item.material || '',
      filtroTratamiento: item.filtroTratamiento || '',
      tipoLenteDescripcion: item.tipoLenteDescripcion || '',
      fechaControl: item.fechaControl || '',
      indicaciones: item.indicaciones || '',
      observaciones: item.observaciones || '',
      recomendaciones: item.recomendaciones || '',
      derecho: item.ojoDerecho as any,
      izquierdo: item.ojoIzquierdo as any,
      lensometriaDerecho: item.lensometria?.derecho as any,
      lensometriaIzquierdo: item.lensometria?.izquierdo as any,
      contacto: item.datosContacto as any
    });

    // Si tiene valores de lensometría cargados, desplegamos la sección automáticamente
    if (item.lensometria?.derecho?.esfera || item.lensometria?.izquierdo?.esfera) {
      this.showLensometria.set(true);
    }
  }

  async save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notify.error('Revisa los campos obligatorios marcados en el formulario', 'Formulario incompleto');
      return;
    }

    this.loading.set(true);
    const value: any = this.form.getRawValue();
    const payload: any = {
      ...value,
      ojoDerecho: this.clean(value.derecho),
      ojoIzquierdo: this.clean(value.izquierdo),
      lensometria: {
        derecho: this.clean(value.lensometriaDerecho),
        izquierdo: this.clean(value.lensometriaIzquierdo)
      },
      datosContacto: this.clean(value.contacto)
    };

    delete payload.derecho;
    delete payload.izquierdo;
    delete payload.lensometriaDerecho;
    delete payload.lensometriaIzquierdo;
    delete payload.contacto;

    if (!payload.profesionalId) payload.profesionalId = null;

    try {
      if (this.id && this.id !== 'new-prescription') {
        await firstValueFrom(this.service.update(this.id, payload));
      } else {
        await firstValueFrom(this.service.create(payload));
      }

      this.notify.success('Prescripción guardada correctamente', 'Registro Exitoso');
      this.router.navigate(['/panel/gestion-operativa/prescripciones']);
    } catch (e: any) {
      this.notify.error(e?.error?.message || 'No fue posible guardar la prescripción', 'Error al procesar');
    } finally {
      this.loading.set(false);
    }
  }

  private clean(group: any): any {
    return Object.fromEntries(
      Object.entries(group || {}).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
  }

  cancel() {
    this.location.back();
  }
}
