import { Component, EventEmitter, Output, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { NominaService } from '../../../services/nomina.service';
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';

@Component({
  selector: 'app-periodo-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './periodo-form-modal.component.html',
})
export class PeriodoFormModalComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private nominaService = inject(NominaService);
  private notification = inject(NotificationService);
  private loader = inject(LoaderService);
  private sub?: Subscription;

  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  meses = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' }, { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' }, { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
  ];

  anioActual = new Date().getFullYear();
  anios = Array.from({ length: 6 }, (_, i) => this.anioActual - 5 + i);

  form: FormGroup = this.fb.group({
    nombre: ['', Validators.required],
    tipo: ['MENSUAL', Validators.required],
    mes: [new Date().getMonth() + 1, Validators.required],
    anio: [this.anioActual, Validators.required],
    quincena: ['PRIMERA'],
    fechaPago: [''],
  });

  fechaInicio = signal('');
  fechaFin = signal('');

  isSubmitting = signal(false);

  ngOnInit() {
    this.calcularPeriodo();
    this.sub = this.form.valueChanges.subscribe(() => this.calcularPeriodo());
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  private calcularPeriodo() {
    const { tipo, mes, anio, quincena } = this.form.value;
    const m = Number(mes);
    const a = Number(anio);
    if (!m || !a) return;

    const mesLabel = this.meses.find(x => x.value === m)?.label || '';
    let inicio: Date;
    let fin: Date;
    let nombreAuto: string;

    if (tipo === 'QUINCENAL') {
      if (quincena === 'SEGUNDA') {
        inicio = new Date(a, m - 1, 16);
        fin = new Date(a, m, 0);
        nombreAuto = `Quincena 2 - ${mesLabel} ${a}`;
      } else {
        inicio = new Date(a, m - 1, 1);
        fin = new Date(a, m - 1, 15);
        nombreAuto = `Quincena 1 - ${mesLabel} ${a}`;
      }
    } else {
      inicio = new Date(a, m - 1, 1);
      fin = new Date(a, m, 0);
      nombreAuto = `Mensual - ${mesLabel} ${a}`;
    }

    this.fechaInicio.set(this.toISO(inicio));
    this.fechaFin.set(this.toISO(fin));

    if (!this.form.get('nombre')?.dirty) {
      this.form.get('nombre')?.setValue(nombreAuto, { emitEvent: false });
    }
  }

  private toISO(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notification.error('Complete el formulario correctamente');
      return;
    }
    this.isSubmitting.set(true);
    this.loader.show();

    const { nombre, tipo, fechaPago } = this.form.value;
    const dto = {
      nombre,
      tipo,
      fechaInicio: this.fechaInicio(),
      fechaFin: this.fechaFin(),
      fechaPago: fechaPago || undefined,
    };

    this.nominaService.createPeriodo(dto).subscribe({
      next: () => {
        this.notification.success('Período creado exitosamente');
        this.saved.emit();
        this.isSubmitting.set(false);
        this.loader.hide();
      },
      error: (err) => {
        this.notification.error('Error al crear período', err);
        this.isSubmitting.set(false);
        this.loader.hide();
      },
    });
  }

  onClose() {
    this.close.emit();
  }
}
