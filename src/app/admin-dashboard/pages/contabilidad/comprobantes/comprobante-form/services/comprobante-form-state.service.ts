import { Injectable, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ComprobanteDetalleInterface } from '../../../interfaces/comprobantes.interface';
import { TerceroSelect } from '../interfaces/comprobante-form.interface';
import { mapTerceroToDetalle, terceroIdFromDetalle } from './comprobante-tercero.mapper';

@Injectable()
export class ComprobanteFormStateService {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    tipoComprobanteId: ['', [Validators.required]],
    fechaDocumento: [new Date().toISOString().substring(0, 10), [Validators.required]],
    observaciones: [''],
    detalles: this.fb.array([]),
  });

  get detalles(): FormArray {
    return this.form.get('detalles') as FormArray;
  }

  addLine(data?: ComprobanteDetalleInterface): void {
    this.detalles.push(this.fb.group({
      cuentaContableId: [data?.cuentaContableId || '', [Validators.required]],
      descripcion: [data?.descripcion || ''],
      debito: [Number(data?.debito || 0), [Validators.required, Validators.min(0)]],
      credito: [Number(data?.credito || 0), [Validators.required, Validators.min(0)]],
      terceroUnionId: [data ? terceroIdFromDetalle(data) : ''],
      centroCostoId: [data?.centroCostoId || ''],
      documentoReferencia: [data?.documentoReferencia || ''],
    }));
  }

  removeLine(index: number): boolean {
    if (this.detalles.length <= 2) return false;
    this.detalles.removeAt(index);
    return true;
  }

  get totalDebitos(): number {
    return this.detalles.controls.reduce((total, control) => total + Number(control.get('debito')?.value || 0), 0);
  }

  get totalCreditos(): number {
    return this.detalles.controls.reduce((total, control) => total + Number(control.get('credito')?.value || 0), 0);
  }

  get diferencia(): number {
    return Math.abs(this.totalDebitos - this.totalCreditos);
  }

  get estaBalanceado(): boolean {
    return this.diferencia <= 0.01;
  }

  squareLine(index: number): void {
    const control = this.detalles.at(index);
    const diferencia = this.totalDebitos - this.totalCreditos;
    if (diferencia > 0) {
      control.get('credito')?.setValue(Number(control.get('credito')?.value || 0) + diferencia);
      control.get('debito')?.setValue(0);
    } else if (diferencia < 0) {
      control.get('debito')?.setValue(Number(control.get('debito')?.value || 0) + Math.abs(diferencia));
      control.get('credito')?.setValue(0);
    }
  }

  buildPayload(terceros: TerceroSelect[]): { tipoComprobanteId: string; fechaDocumento: string; observaciones: string; detalles: ComprobanteDetalleInterface[] } {
    const raw = this.form.getRawValue();
    return {
      tipoComprobanteId: raw.tipoComprobanteId || '',
      fechaDocumento: raw.fechaDocumento || '',
      observaciones: raw.observaciones || '',
      detalles: (raw.detalles || []).map((detalle: any) => {
        const { terceroUnionId, ...linea } = detalle;
        const tercero = terceros.find((item) => item.id === terceroUnionId);
        return {
          ...linea,
          ...mapTerceroToDetalle(tercero),
          centroCostoId: linea.centroCostoId || undefined,
          documentoReferencia: linea.documentoReferencia || undefined,
        };
      }),
    };
  }
}
