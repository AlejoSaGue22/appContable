import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FormErrorLabelComponent } from '@utils/components/form-error-label/form-error-label.component';
import { NotificationService } from '@shared/services/notification.service';
import { PrescripcionesService } from '@dashboard/pages/ventas/services/prescripciones.service';
import { ClientesService } from '@dashboard/pages/ventas/services/clientes.service';
import { Prescripcion, ProfesionalResponsable, TipoExamenPrescripcion, TipoLentePrescripcion } from '@dashboard/pages/ventas/interfaces/prescripcion.interface';
import { ClientesInterfaceResponse, ClientesResponse } from '@dashboard/interfaces/clientes-interface';


@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './prescripcion-form.component.html'
})
export class PrescripcionFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
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
    return c.tipoDocumentoRel?.abreviatura || c.tipoDocumento || '';
  }

  get tipoDocumentoDisplay(): string {
    const c = this.client;
    if (!c) return 'Seleccione paciente';
    if (c.tipoDocumentoRel?.abreviatura && c.tipoDocumentoRel?.nombre) {
      return `${c.tipoDocumentoRel.abreviatura} - ${c.tipoDocumentoRel.nombre}`;
    }
    return c.tipoDocumentoRel?.abreviatura || c.tipoDocumentoRel?.nombre || c.tipoDocumento || '---';
  }

  get numeroDocumentoDisplay(): string {
    const c = this.client;
    if (!c) return 'Seleccione paciente';
    return c.numeroDocumento ? `${c.numeroDocumento}${c.dv ? '-' + c.dv : ''}` : '---';
  }

  get lensType(): TipoLentePrescripcion {
    return (this.form.get('tipoLente')?.value as TipoLentePrescripcion) || 'OFTALMICO';
  }

  setTipoLente(type: TipoLentePrescripcion) {
    this.form.patchValue({ tipoLente: type });
  }

  setAgudeza(eye: 'derecho' | 'izquierdo', field: 'agudezaLejana' | 'agudezaProxima', val: string) {
    this.form.get(eye)?.get(field)?.setValue(val);
  }

  toggleLensometria() {
    this.showLensometria.update(v => !v);
  }

  async ngOnInit() {
    try {
      const [response, types, professionals] = await Promise.all([
        firstValueFrom(this.clientesService.getClientes({ limit: 100, offset: 0 })) as Promise<ClientesResponse>,
        firstValueFrom(this.service.listTiposExamen()),
        firstValueFrom(this.service.listProfesionales()),
      ]);
      this.patients.set(response.clientes || []);
      this.tiposExamen.set(types.data || []);
      this.professionals.set(professionals.data || []);

      const defaultType = this.tiposExamen().find((type) => type.codigo === 'VALORACION_VISUAL');
      if (defaultType) this.form.patchValue({ tipoExamenId: defaultType.id });

      if (this.id && this.id !== 'new-prescription') {
        const result = await firstValueFrom(this.service.get(this.id));
        if (result.data?.cliente && !this.patients().some((p) => p.id === result.data.clienteId)) {
          this.patients.update((list) => [result.data.cliente, ...list]);
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
