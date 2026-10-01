import { Component, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MovimientoItem } from '@dashboard/interfaces/pagos-interface';
import { PrintService } from '@shared/services/print.service';

@Component({
 selector: 'app-volante-pago',
 standalone: true,
 imports: [CommonModule],
 templateUrl: './volante-pago.component.html',
})
export class VolantePagoComponent {
 private printService = inject(PrintService);

 movimiento = input.required<MovimientoItem>();

 isIngreso(tipo: string): boolean {
   return tipo === 'cobro' || tipo === 'otro_ingreso';
 }

 get titulo(): string {
   return this.isIngreso(this.movimiento().tipo) ? 'COMPROBANTE DE COBRO' : 'COMPROBANTE DE PAGO';
 }

 get labelContraparte(): string {
   return this.isIngreso(this.movimiento().tipo) ? 'Recibi de' : 'Pague a';
 }

 get labelConcepto(): string {
   return this.isIngreso(this.movimiento().tipo) ? 'Por concepto de cobro' : 'Por concepto de pago';
 }

 get medioLabel(): string {
   const labels: Record<string, string> = {
     caja: 'Efectivo (Caja)',
     banco: 'Banco',
     transferencia: 'Transferencia bancaria',
     cheque: 'Cheque',
   };
   return labels[this.movimiento().medioPago] ?? this.movimiento().medioPago;
 }

 get cuentaInfo(): string {
   const m = this.movimiento();
   if (!m.cuentaBancaria) return '';
   const banco = m.cuentaBancaria.banco?.nombre ?? '';
   return `${banco} - ${m.cuentaBancaria.numeroCuenta}`;
 }

 imprimir(): void {
   const m = this.movimiento();
   const html = this.generarHTML(m);
   const printWindow = window.open('', '_blank', 'width=800,height=600');
   if (printWindow) {
     printWindow.document.write(html);
     printWindow.document.close();
     printWindow.onload = () => {
       printWindow.focus();
       printWindow.print();
       printWindow.close();
     };
   }
 }

 private generarHTML(m: MovimientoItem): string {
   const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 });
   const fecha = new Date(m.fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
   const titulo = this.isIngreso(m.tipo) ? 'COMPROBANTE DE COBRO' : 'COMPROBANTE DE PAGO';
   const labelContraparte = this.isIngreso(m.tipo) ? 'Recibi de' : 'Pague a';
   const labelConcepto = this.isIngreso(m.tipo) ? 'Por concepto de cobro' : 'Por concepto de pago';
   const medio = this.medioLabel;
   const cuenta = this.cuentaInfo;

   const esFactura = m.tipo === 'cobro' || m.tipo === 'pago';
   const valorConcepto = esFactura ? `Factura ${m.numeroFactura}` : m.numeroFactura;

   return `<!DOCTYPE html><html><head><title>${titulo}</title>
<style>
 body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; color: #1e293b; }
 .volante { max-width: 600px; margin: 0 auto; border: 2px solid #334155; padding: 30px; }
 .header { text-align: center; border-bottom: 2px solid #334155; padding-bottom: 15px; margin-bottom: 20px; }
 .header h1 { margin: 0; font-size: 18px; letter-spacing: 2px; }
 .header p { margin: 5px 0 0; font-size: 12px; color: #64748b; }
 .field { margin-bottom: 12px; }
 .field label { font-size: 11px; font-weight: 600; text-transform: uppercase; color: #64748b; display: block; margin-bottom: 2px; }
 .field .value { font-size: 14px; font-weight: 500; }
 .monto { font-size: 22px; font-weight: 700; color: #1e40af; margin: 15px 0; text-align: center; }
 .separator { border-top: 1px dashed #cbd5e1; margin: 15px 0; }
 .firmas { display: flex; justify-content: space-between; margin-top: 40px; }
 .firma { text-align: center; width: 45%; }
 .firma .linea { border-top: 1px solid #334155; margin-bottom: 5px; }
 .firma span { font-size: 11px; color: #64748b; }
 @media print { body { padding: 20px; } .no-print { display: none; } }
</style></head><body>
<div class="volante">
 <div class="header">
 <h1>${titulo}</h1>
 <p>Fecha: ${fecha}</p>
 </div>
  <div style="display: flex; justify-content: space-between;">
    <div class="field" style="width: 48%;">
      <label>N° Comprobante</label>
      <div class="value" style="font-family: monospace;">${m.numero}</div>
    </div>
    <div class="field" style="width: 48%;">
      <label>Elaborado por</label>
      <div class="value">${m.creadoPor}</div>
    </div>
  </div>
  <div class="field">
    <label>${labelContraparte}</label>
    <div class="value">${m.contraparteNombre}</div>
  </div>
  <div class="monto">${fmt.format(Number(m.monto))}</div>
  <div class="separator"></div>
  <div class="field">
    <label>${labelConcepto}</label>
    <div class="value">${valorConcepto}</div>
  </div>
  <div class="field">
    <label>Medio de pago</label>
    <div class="value">${medio}</div>
  </div>
  ${cuenta ? `<div class="field"><label>Cuenta bancaria</label><div class="value">${cuenta}</div></div>` : ''}
  ${m.referencia ? `<div class="field"><label>Referencia</label><div class="value">${m.referencia}</div></div>` : ''}
  ${m.notas ? `<div class="field"><label>Observaciones</label><div class="value">${m.notas}</div></div>` : ''}
  <div class="firmas">
    <div class="firma">
      <div class="linea"></div>
      <span style="display: block; margin-bottom: 4px;">Recibe</span>
      <div style="font-size: 11px; font-weight: 600; color: #1e293b;">
        ${this.isIngreso(m.tipo) ? m.creadoPor : m.contraparteNombre}
      </div>
    </div>
    <div class="firma">
      <div class="linea"></div>
      <span style="display: block; margin-bottom: 4px;">Entrega</span>
      <div style="font-size: 11px; font-weight: 600; color: #1e293b;">
        ${this.isIngreso(m.tipo) ? m.contraparteNombre : m.creadoPor}
      </div>
    </div>
  </div>
</div>
</body></html>`;
 }
}
