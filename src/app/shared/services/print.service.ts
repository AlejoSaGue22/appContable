import { Injectable } from '@angular/core';
import { GetFacturaRequest } from '@dashboard/interfaces/documento-venta-interface';
import { FacturaCompraResponse } from '@dashboard/interfaces/factura-compra-interface';
import { NotaAjuste } from '@dashboard/interfaces/notas-ajuste-interface';
import { NotaAjusteCompra } from '@dashboard/interfaces/notas-ajuste-compra-interface';
import { HelpersUtils } from '@utils/helpers.utils';

export interface EmpresaInfo {
  nombre: string;
  nit: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  sucursal: string;
  textoAdicional?: string;
}

/** Constantes editables — reemplazar por endpoint cuando esté disponible */
const EMPRESA_DEFAULT: EmpresaInfo = {
  nombre: 'Factus',
  nit: '901724254-1',
  telefono: '3001234567',
  email: 'ventas@miempresa.com',
  direccion: 'Calle 123',
  ciudad: 'San Gil - Santander',
  sucursal: 'Sucursal Principal',
  textoAdicional: 'texto de prueba',
};

@Injectable({ providedIn: 'root' })
export class PrintService {

  private empresa: EmpresaInfo = EMPRESA_DEFAULT;
  private logoApp = `/${HelpersUtils.logoApp}`;
  private nameApp = HelpersUtils.nameApp;

  // ──────────────────────────────────────────────────────────────────────
  //  IMPRIMIR FACTURA DE VENTA
  // ──────────────────────────────────────────────────────────────────────
  printInvoice(factura: GetFacturaRequest): void {
    const html = this.buildInvoiceHtml(factura);
    this.openPrintWindow(html, `Factura ${factura.comprobante_completo}`);
  }

  // ──────────────────────────────────────────────────────────────────────
  //  IMPRIMIR ASIENTO CONTABLE
  // ──────────────────────────────────────────────────────────────────────
  printAsientoContable(asientos: any[], facturaRef: string): void {
    const html = this.buildAsientoHtml(asientos, facturaRef);
    this.openPrintWindow(html, `Asiento ${facturaRef}`);
  }

  // ──────────────────────────────────────────────────────────────────────
  //  IMPRIMIR FACTURA DE COMPRA
  // ──────────────────────────────────────────────────────────────────────
  printPurchaseInvoice(compra: FacturaCompraResponse): void {
    const html = this.buildPurchaseInvoiceHtml(compra);
    this.openPrintWindow(html, `Compra ${compra.numero}`);
  }

  // ──────────────────────────────────────────────────────────────────────
  //  IMPRIMIR NOTA DE AJUSTE (CRÉDITO/DÉBITO)
  // ──────────────────────────────────────────────────────────────────────
  printAdjustmentNote(nota: NotaAjuste, conceptoLabel?: string): void {
    const html = this.buildAdjustmentNoteHtml(nota, conceptoLabel);
    const title = nota.tipo === 'credito' ? 'Nota Crédito' : 'Nota Débito';
    this.openPrintWindow(html, `${title} ${nota.prefijo}${nota.numero}`);
  }

  // ──────────────────────────────────────────────────────────────────────
  //  IMPRIMIR NOTA DE AJUSTE COMPRA (CRÉDITO/DÉBITO)
  // ──────────────────────────────────────────────────────────────────────
  printAdjustmentNoteCompra(nota: NotaAjusteCompra): void {
    const html = this.buildAdjustmentNoteCompraHtml(nota);
    const title = nota.tipo === 'credito' ? 'Nota Crédito Compra' : 'Nota Débito Compra';
    this.openPrintWindow(html, `${title} ${nota.prefijo || ''}${nota.numeroCompleto || nota.id}`);
  }

  // ══════════════════════════════════════════════════════════════════════
  //  PRIVATE — Abrir ventana de impresión
  // ══════════════════════════════════════════════════════════════════════
  private openPrintWindow(html: string, title: string): void {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) return;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 800);
    };
  }

  // ══════════════════════════════════════════════════════════════════════
  //  PRIVATE — Construir HTML de Factura
  // ══════════════════════════════════════════════════════════════════════
  private buildInvoiceHtml(f: GetFacturaRequest): string {
    const tipoLabel = f.tipoFactura === 'ELECTRONICA'
      ? 'FACTURA ELECTRÓNICA DE VENTA'
      : 'FACTURA DE VENTA';
    const clienteNombre = f.client.razonSocial || `${f.client.nombre} ${f.client.apellido}`;
    const tipoDocLabel = f.client.tipoDocumentoRel?.abreviatura || 'CC/NIT';
    const fechaGen = this.formatDateTimePrint(f.createdAt);
    const fechaVal = f.fechaEnvioDIAN ? this.formatDateTimePrint(f.fechaEnvioDIAN) : fechaGen;
    const fechaVenc = f.fechaVencimiento || f.fecha;

    const itemsRows = f.items.map((item, i) => `
      <tr>
        <td style="text-align:center;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;">${i + 1}</td>
        <td style="padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:9px;font-family:'Courier New',monospace;color:#475569;">${item.articulo?.codigo || ''}</td>
        <td style="padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${item.description || item.articulo?.nombre || ''}</td>
        <td style="text-align:right;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${this.fmt(item.unitPrice)}</td>
        <td style="text-align:center;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${item.quantity}</td>
        <td style="text-align:center;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${item.discount || 0}</td>
        <td style="text-align:center;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${item.iva || 0}</td>
        <td style="text-align:right;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#1e293b;">${this.fmt(item.total)}</td>
      </tr>
    `).join('');

    const qrBlock = f.qrCode
      ? `<td style="width:100px;text-align:center;vertical-align:top;padding:6px;">
           <img src="${f.qrCode}" alt="QR DIAN" style="width:88px;height:88px;"/>
         </td>`
      : '';

    const cufeSection = f.cufe
      ? `<tr><td colspan="2" style="padding:6px 0;">
           <div style="background:#f8fafc;border:1px solid #cbd5e1;padding:6px 10px;font-size:10px;color:#000000;word-break:break-all;text-align:center;">
             CUFE: ${f.cufe}
           </div>
         </td></tr>`
      : '';

    const formaPagoLabel = f.formaPago === 'CONTADO' ? 'Pago de contado' : 'Pago a crédito';
    const metodoPagoLabel = f.metodoPagoRel?.nombre || f.metodoPago || '—';
    const tipoOpLabel = f.tipoFactura === 'ELECTRONICA' ? 'Electrónica' : 'Estándar';

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Factura ${f.comprobante_completo}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',sans-serif; font-size:11px; color:#1e293b; background:#fff; }

    @media print {
      @page { margin:0; size:A4; }
      body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    }
  </style>
</head>
<body>

<!-- Outer wrapper for page -->
<table cellpadding="0" cellspacing="0" style="width:210mm;min-height:297mm;margin:0 auto;border-collapse:collapse;">
<tr>
  <!-- Left blue bar -->
  <!-- <td style="width:5px;background:#000000;"></td> -->

  <!-- Main content -->
  <td style="vertical-align:top;padding:28px 36px 20px 20px;">

    <!-- ═══════ HEADER ═══════ -->
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">
    <tr>
      <!-- Left: Logo/Empresa name -->
      <td style="width:140px;vertical-align:top;padding-right:16px;">
        <div style="font-size:28px;font-weight:800;color:#000000;line-height:1;margin-bottom:4px;letter-spacing:-0.5px;">
        <img src="${this.logoApp}" alt="Logo" style="width:100px;height:100px;"/>
        </div>
      </td>

      <!-- Center: Invoice type + empresa info -->
      <td style="vertical-align:top;text-align:center;">
        <div style="font-size:13px;font-weight:800;color:#000000;text-transform:uppercase;letter-spacing:0.5px;">${tipoLabel}</div>
        <div style="font-size:12px;font-weight:700;color:#000000;margin-top:2px;">NÚMERO ${f.comprobante_completo}</div>
        <div style="margin-top:6px;line-height:1.5;color:#475569;font-size:9.5px;">
          <strong style="color:#334155;">${this.empresa.sucursal}</strong><br/>
          NIT: ${this.empresa.nit}<br/>
          ${this.empresa.telefono}<br/>
          ${this.empresa.email}<br/>
          ${this.empresa.direccion}<br/>
          ${this.empresa.ciudad}
          ${this.empresa.textoAdicional ? '<br/>' + this.empresa.textoAdicional : ''}
        </div>
      </td>

      <!-- Right: QR Code -->
      ${qrBlock}
    </tr>
    </table>

    <!-- ═══════ CLIENT INFO ═══════ -->
    <table cellpadding="0" cellspacing="0" style="width:100%;border:1.5px solid #cbd5e1;border-radius:4px;margin-bottom:16px;border-collapse:separate;overflow:hidden;">
    <tr>
      <!-- Client data -->
      <td style="vertical-align:top;padding:10px 14px;width:55%;">
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:700;color:#000000;width:90px;">${tipoDocLabel}:</td>
            <td style="padding:3px 0;font-size:10px;color:#334155;">${f.client.numeroDocumento}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:700;color:#000000;">Cliente:</td>
            <td style="padding:3px 0;font-size:10px;color:#334155;font-weight:500;">${clienteNombre}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:700;color:#000000;">Dirección:</td>
            <td style="padding:3px 0;font-size:10px;color:#334155;">${f.client.direccion || '—'}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:700;color:#000000;">Municipio:</td>
            <td style="padding:3px 0;font-size:10px;color:#334155;">${f.client.ciudadRel?.name || '—'}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:700;color:#000000;">Email:</td>
            <td style="padding:3px 0;font-size:10px;color:#334155;">${f.client.email || '—'}</td>
          </tr>
        </table>
      </td>

      <!-- Dates -->
      <td style="vertical-align:top;padding:10px 14px;width:45%;border-left:1.5px solid #cbd5e1;background:#f8fafc;">
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:600;color:#64748b;">Fecha de generación:</td>
            <td style="padding:3px 0;font-size:10px;font-weight:500;color:#334155;text-align:right;">${fechaGen}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:600;color:#64748b;">Fecha de validación:</td>
            <td style="padding:3px 0;font-size:10px;font-weight:500;color:#334155;text-align:right;">${fechaVal}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:600;color:#64748b;">Fecha de vencimiento:</td>
            <td style="padding:3px 0;font-size:10px;font-weight:500;color:#334155;text-align:right;">${this.formatDatePrint(fechaVenc)}</td>
          </tr>
        </table>
      </td>
    </tr>
    </table>

    <!-- ═══════ ITEMS TABLE ═══════ -->
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <thead>
        <tr style="background:#efefef;">
          <th style="padding:8px 5px;font-size:9px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.5px;text-align:center;width:30px;">#</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.5px;text-align:left;">Código</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.5px;text-align:left;">Descripción</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.5px;text-align:right;">Val. Unit</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">Cantidad</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">Descuento</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">IVA %</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.5px;text-align:right;">Val. Item</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- ═══════ OBSERVACIONES + TOTALES ═══════ -->
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:30px;">
    <tr>
      <!-- Observaciones -->
      <td style="vertical-align:top;padding-right:16px;width:55%;">
        <div style="border:1px solid #cbd5e1;border-radius:4px;padding:10px;min-height:80px;">
          <div style="font-size:10px;font-weight:700;color:#334155;margin-bottom:4px;">Observaciones</div>
          <div style="font-size:10px;color:#64748b;line-height:1.5;">${f.observaciones || ''}</div>
        </div>
      </td>

      <!-- Totales -->
      <td style="vertical-align:top;width:45%;">
        <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #cbd5e1;border-radius:4px;border-collapse:separate;overflow:hidden;">
          <tr>
            <td style="padding:6px 12px;font-size:10px;color:#475569;border-bottom:1px solid #f1f5f9;">Valor Bruto</td>
            <td style="padding:6px 12px;font-size:10px;color:#1e293b;text-align:right;border-bottom:1px solid #f1f5f9;">${this.fmt(f.subtotal)}</td>
          </tr>
          <tr>
            <td style="padding:6px 12px;font-size:10px;color:#475569;border-bottom:1px solid #f1f5f9;">Base Imponible</td>
            <td style="padding:6px 12px;font-size:10px;color:#1e293b;text-align:right;border-bottom:1px solid #f1f5f9;">${this.fmt(f.subtotal)}</td>
          </tr>
          ${f.iva > 0 ? `<tr>
            <td style="padding:6px 12px;font-size:10px;color:#475569;border-bottom:1px solid #f1f5f9;">IVA</td>
            <td style="padding:6px 12px;font-size:10px;color:#1e293b;text-align:right;border-bottom:1px solid #f1f5f9;">${this.fmt(f.iva)}</td>
          </tr>` : ''}
          ${f.descuento > 0 ? `<tr>
            <td style="padding:6px 12px;font-size:10px;color:#475569;border-bottom:1px solid #f1f5f9;">Descuento global(-)</td>
            <td style="padding:6px 12px;font-size:10px;color:#dc2626;text-align:right;border-bottom:1px solid #f1f5f9;">-${this.fmt(f.descuento)}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:6px 12px;font-size:10px;color:#475569;border-bottom:1px solid #f1f5f9;">Recargo global(+)</td>
            <td style="padding:6px 12px;font-size:10px;color:#1e293b;text-align:right;border-bottom:1px solid #f1f5f9;">${this.fmt(0)}</td>
          </tr>
          <tr>
            <td style="padding:8px 12px;font-size:11px;font-weight:800;color:#000000;background:#efefef;">Total Factura</td>
            <td style="padding:8px 12px;font-size:12px;color:#000000;text-align:right;background:#efefef;">${this.fmt(f.total)}</td>
          </tr>
        </table>
      </td>
    </tr>
    </table>

    <!-- ═══════ PAGO + TIPO OPERACIÓN ═══════ -->
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:8px;">
    <tr>
      <td style="vertical-align:top;width:35%;padding-right:20px;">
        <div style="font-size:10px;font-weight:700;color:#000000;margin-bottom:4px;">Tipo de operación</div>
        <div style="font-size:11px;font-weight:500;color:#475569;">${tipoOpLabel}</div>
      </td>
      <td style="vertical-align:top;">
        <div style="font-size:10px;font-weight:700;color:#000000;margin-bottom:4px;">Detalles de pago</div>
        <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="padding:2px 0;font-size:10px;font-weight:800;color:#000000;">Forma de pago</td>
          </tr>
          <tr>
            <td style="padding:0 0 4px;font-size:10px;color:#000000;">${formaPagoLabel}</td>
          </tr>
          <tr>
            <td style="padding:2px 0;font-size:10px;font-weight:800;color:#000000;">Medio de pago</td>
          </tr>
          <tr>
            <td style="padding:0 0 4px;font-size:10px;color:#000000;">${metodoPagoLabel}</td>
          </tr>
          <tr>
            <td style="padding:2px 0;font-size:10px;font-weight:800;color:#000000;">Moneda</td>
          </tr>
          <tr>
            <td style="padding:0 0 4px;font-size:10px;color:#000000;">${this.fmt(f.total)}</td>
          </tr>
          <tr>
            <td style="padding:2px 0;font-size:10px;font-weight:800;color:#000000;">Fecha de vencimiento</td>
          </tr>
          <tr>
            <td style="padding:0 0 4px;font-size:10px;color:#000000;">${this.formatDatePrint(fechaVenc)}</td>
          </tr>
        </table>
      </td>
    </tr>
    </table>

    <!-- ═══════ CUFE ═══════ -->
    ${cufeSection}

  </td>

  <!-- Right blue bar -->
  <td>
    <div style="position:absolute;top:50%;left:99%;transform:translate(-50%,-50%) rotate(90deg);color:#000000;font-size:10px;letter-spacing:1px;font-weight:600;white-space:nowrap;">
      Factura generada con software propio autorizado por la DIAN
    </div>
  </td>
</tr>
</table>

</body>
</html>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  //  PRIVATE — Construir HTML de Asiento Contable
  // ══════════════════════════════════════════════════════════════════════
  private buildAsientoHtml(asientos: any[], facturaRef: string): string {
    const asientosHtml = asientos.map(asiento => {
      const detallesRows = asiento.detalles.map((d: any) => `
        <tr>
          <td class="tercero">${d.tercero || '—'}</td>
          <td>${d.cuenta?.nombre || '—'}</td>
          <td>${d.descripcion || '—'}</td>
          <td class="right debito">${d.debito > 0 ? this.fmt(d.debito) : ''}</td>
          <td class="right credito">${d.credito > 0 ? this.fmt(d.credito) : ''}</td>
        </tr>
      `).join('');

      return `
      <div class="asiento-card">
        <!-- Header -->
        <div class="asiento-header">
          <div class="header-side">Asiento contable</div>
          <div class="header-center">
            <div class="empresa">${this.empresa.nombre}</div>
            <div class="fecha-section">
              <strong>FECHA</strong>
              <span class="fecha-value">${this.formatDatePrint(asiento.fecha)}</span>
              <span class="fecha-hint">(DD/MM/AAAA)</span>
            </div>
          </div>
          <div class="header-side right-side">
            <span class="label-sm">Asiento contable</span>
            <span class="numero">No. ${asiento.numero || facturaRef}</span>
          </div>
        </div>

        <!-- Table -->
        <table class="asiento-table">
          <thead>
            <tr>
              <th class="col-tercero">TERCERO</th>
              <th class="col-cuenta">CUENTA CONTABLE</th>
              <th class="col-desc">DESCRIPCIÓN</th>
              <th class="col-debito">DÉBITO</th>
              <th class="col-credito">CRÉDITO</th>
            </tr>
          </thead>
          <tbody>
            ${detallesRows}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="3" class="total-label">Total</td>
              <td class="right total-debito">${this.fmt(asiento.totalDebito)}</td>
              <td class="right total-credito">${this.fmt(asiento.totalCredito)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
      `;
    }).join('<div class="page-break"></div>');

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Asiento Contable — ${facturaRef}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',sans-serif; font-size:11px; color:#1e293b; background:#fff; }
    .page { width:210mm; margin:0 auto; padding:10mm 10mm; }

    /* Card */
    .asiento-card { border:1.5px solid #cbd5e1; border-radius:8px; overflow:hidden; margin-bottom:20px; }

    /* Header */
    .asiento-header { display:flex; justify-content:space-between; align-items:flex-start; padding:14px 20px; border-bottom:2px solid #e2e8f0; }
    .header-side { font-size:10px; font-weight:500; color:#64748b; min-width:120px; }
    .header-side.right-side { text-align:right; }
    .header-center { text-align:center; flex:1; }
    .empresa { font-size:18px; font-weight:800; color:#1e293b; margin-bottom:6px; letter-spacing:-0.3px; }
    .fecha-section { font-size:11px; color:#334155; }
    .fecha-section strong { display:block; font-size:11px; letter-spacing:2px; margin-bottom:2px; }
    .fecha-value { font-weight:600; margin-right:8px; }
    .fecha-hint { color:#94a3b8; font-size:9px; }
    .label-sm { font-size:10px; color:#64748b; display:block; margin-bottom:2px; }
    .numero { font-size:14px; font-weight:800; color:#000000; }

    /* Table */
    .asiento-table { width:100%; border-collapse:collapse; }
    .asiento-table thead th {
      background:#efefef;
      color:#000000; font-size:9px; font-weight:700; text-transform:uppercase;
      letter-spacing:0.8px; padding:10px 12px; text-align:left;
    }
    .col-tercero { width:18%; }
    .col-cuenta { width:28%; }
    .col-desc { width:28%; }
    .col-debito { width:13%; text-align:right !important; }
    .col-credito { width:13%; text-align:right !important; }
    .asiento-table tbody td {
      padding:8px 12px; border-bottom:1px solid #f1f5f9; font-size:10px; color:#475569;
    }
    .asiento-table .tercero { font-family:'Courier New',monospace; font-size:10px; color:#64748b; }
    .asiento-table .right { text-align:right; }
    .asiento-table .debito { color:#15803d; font-weight:600; }
    .asiento-table .credito { color:#b91c1c; font-weight:600; }

    /* Footer totals */
    .total-row td { 
      background:#f8fafc; border-top:2.5px solid #334155; 
      padding:10px 12px; font-weight:800; font-size:11px; 
    }
    .total-label { color:#334155; text-transform:uppercase; letter-spacing:1px; font-size:10px; }
    .total-debito { color:#15803d; text-align:right; }
    .total-credito { color:#b91c1c; text-align:right; }

    .page-break { 
      /* page-break-after:always;  */
      height:0; 
    }

    @media print {
      @page { margin:10mm; size:A4 landscape; }
      .page { width:100%; padding:0; }
      .asiento-card { break-inside:avoid; }
    }
  </style>
</head>
<body>
<div class="page">
  ${asientosHtml}
</div>
</body>
</html>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  //  PRIVATE — Construir HTML de Factura de Compra
  // ══════════════════════════════════════════════════════════════════════
  private buildPurchaseInvoiceHtml(c: FacturaCompraResponse): string {
    const proveedorNombre = c.proveedor.razonSocial?.trim() || c.proveedor.nombre?.trim() || '—';
    const proveedorNit = c.proveedor.identificacion || '—';
    const fechaGen = this.formatDateTimePrint(c.createdAt);
    const fechaVenc = c.fechaVencimiento || c.fecha;

    const itemsRows = c.items.map((item, i) => `
      <tr>
        <td style="text-align:center;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;">${i + 1}</td>
        <td style="padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:9px;font-family:'Courier New',monospace;color:#475569;">${item.articulo?.codigo || ''}</td>
        <td style="padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${item.descripcion || item.articulo?.nombre || ''}</td>
        <td style="text-align:right;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${this.fmt(item.unitPrice)}</td>
        <td style="text-align:center;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${item.quantity}</td>
        <td style="text-align:center;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${item.descuento || 0}</td>
        <td style="text-align:center;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${item.porcentajeIva || 0}%</td>
        <td style="text-align:right;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#1e293b;font-weight:600;">${this.fmt(item.itemTotal || 0)}</td>
      </tr>
    `).join('');

    const formaPagoLabel = c.formaPago === 'CONTADO' ? 'Pago de contado' : 'Pago a crédito';
    const metodoPagoLabel = c.metodoPagoRel?.nombre || c.metodoPago || '—';

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Factura de Compra ${c.numero}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:'Inter',sans-serif; font-size:11px; color:#1e293b; background:#fff; }

    @media print {
      @page { margin:0; size:A4; }
      body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
    }
  </style>
</head>
<body>

<!-- Outer wrapper for page -->
<table cellpadding="0" cellspacing="0" style="width:210mm;min-height:297mm;margin:0 auto;border-collapse:collapse;">
<tr>
  <!-- Main content -->
  <td style="vertical-align:top;padding:28px 36px 20px 20px;">

    <!-- ═══════ HEADER ═══════ -->
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">
    <tr>
      <!-- Left: Logo -->
      <td style="width:140px;vertical-align:top;padding-right:16px;">
        <div style="font-size:28px;font-weight:800;color:#000000;line-height:1;margin-bottom:4px;letter-spacing:-0.5px;">
        <img src="${this.logoApp}" alt="Logo" style="width:100px;height:100px;"/>
        </div>
      </td>

      <!-- Center: Document type + empresa info -->
      <td style="vertical-align:top;text-align:center;">
        <div style="font-size:13px;font-weight:800;color:#000000;text-transform:uppercase;letter-spacing:0.5px;">FACTURA DE COMPRA</div>
        <div style="font-size:12px;font-weight:700;color:#000000;margin-top:2px;">NÚMERO ${c.numero}</div>
        ${c.numeroFacturaProveedor ? `<div style="font-size:10px;color:#64748b;margin-top:2px;">Ref. Proveedor: ${c.numeroFacturaProveedor}</div>` : ''}
        <div style="margin-top:6px;line-height:1.5;color:#475569;font-size:9.5px;">
          <strong style="color:#334155;">${this.empresa.sucursal}</strong><br/>
          NIT: ${this.empresa.nit}<br/>
          ${this.empresa.telefono}<br/>
          ${this.empresa.email}<br/>
          ${this.empresa.direccion}<br/>
          ${this.empresa.ciudad}
          ${this.empresa.textoAdicional ? '<br/>' + this.empresa.textoAdicional : ''}
        </div>
      </td>
    </tr>
    </table>

    <!-- ═══════ PROVEEDOR INFO ═══════ -->
    <table cellpadding="0" cellspacing="0" style="width:100%;border:1.5px solid #cbd5e1;border-radius:4px;margin-bottom:16px;border-collapse:separate;overflow:hidden;">
    <tr>
      <!-- Proveedor data -->
      <td style="vertical-align:top;padding:10px 14px;width:55%;">
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:700;color:#000000;width:90px;">NIT:</td>
            <td style="padding:3px 0;font-size:10px;color:#334155;">${proveedorNit}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:700;color:#000000;">Proveedor:</td>
            <td style="padding:3px 0;font-size:10px;color:#334155;font-weight:500;">${proveedorNombre}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:700;color:#000000;">Dirección:</td>
            <td style="padding:3px 0;font-size:10px;color:#334155;">${c.proveedor.direccion || '—'}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:700;color:#000000;">Teléfono:</td>
            <td style="padding:3px 0;font-size:10px;color:#334155;">${c.proveedor.telefono || '—'}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:700;color:#000000;">Email:</td>
            <td style="padding:3px 0;font-size:10px;color:#334155;">${c.proveedor.email || '—'}</td>
          </tr>
        </table>
      </td>

      <!-- Dates -->
      <td style="vertical-align:top;padding:10px 14px;width:45%;border-left:1.5px solid #cbd5e1;background:#f8fafc;">
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:600;color:#64748b;">Fecha de registro:</td>
            <td style="padding:3px 0;font-size:10px;font-weight:500;color:#334155;text-align:right;">${fechaGen}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:600;color:#64748b;">Fecha factura:</td>
            <td style="padding:3px 0;font-size:10px;font-weight:500;color:#334155;text-align:right;">${this.formatDatePrint(c.fecha)}</td>
          </tr>
          ${c.fechaVencimiento ? `<tr>
            <td style="padding:3px 0;font-size:10px;font-weight:600;color:#64748b;">Fecha de vencimiento:</td>
            <td style="padding:3px 0;font-size:10px;font-weight:500;color:#334155;text-align:right;">${this.formatDatePrint(fechaVenc)}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:600;color:#64748b;">Estado:</td>
            <td style="padding:3px 0;font-size:10px;font-weight:600;color:#334155;text-align:right;text-transform:capitalize;">${c.estado}</td>
          </tr>
        </table>
      </td>
    </tr>
    </table>

    <!-- ═══════ ITEMS TABLE ═══════ -->
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <thead>
        <tr style="background:#efefef;">
          <th style="padding:8px 5px;font-size:9px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.5px;text-align:center;width:30px;">#</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.5px;text-align:left;">Código</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.5px;text-align:left;">Descripción</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.5px;text-align:right;">Val. Unit</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">Cantidad</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">Descuento</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">IVA</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.5px;text-align:right;">Val. Item</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- ═══════ OBSERVACIONES + TOTALES ═══════ -->
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:30px;">
    <tr>
      <!-- Observaciones -->
      <td style="vertical-align:top;padding-right:16px;width:55%;">
        <div style="border:1px solid #cbd5e1;border-radius:4px;padding:10px;min-height:80px;">
          <div style="font-size:10px;font-weight:700;color:#334155;margin-bottom:4px;">Observaciones</div>
          <div style="font-size:10px;color:#64748b;line-height:1.5;">${c.observaciones || ''}</div>
        </div>
      </td>

      <!-- Totales -->
      <td style="vertical-align:top;width:45%;">
        <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #cbd5e1;border-radius:4px;border-collapse:separate;overflow:hidden;">
          <tr>
            <td style="padding:6px 12px;font-size:10px;color:#475569;border-bottom:1px solid #f1f5f9;">Valor Bruto</td>
            <td style="padding:6px 12px;font-size:10px;color:#1e293b;text-align:right;border-bottom:1px solid #f1f5f9;">${this.fmt(c.subtotal)}</td>
          </tr>
          <tr>
            <td style="padding:6px 12px;font-size:10px;color:#475569;border-bottom:1px solid #f1f5f9;">Base Imponible</td>
            <td style="padding:6px 12px;font-size:10px;color:#1e293b;text-align:right;border-bottom:1px solid #f1f5f9;">${this.fmt(c.subtotal)}</td>
          </tr>
          ${c.iva > 0 ? `<tr>
            <td style="padding:6px 12px;font-size:10px;color:#475569;border-bottom:1px solid #f1f5f9;">IVA</td>
            <td style="padding:6px 12px;font-size:10px;color:#1e293b;text-align:right;border-bottom:1px solid #f1f5f9;">${this.fmt(c.iva)}</td>
          </tr>` : ''}
          ${c.descuento > 0 ? `<tr>
            <td style="padding:6px 12px;font-size:10px;color:#475569;border-bottom:1px solid #f1f5f9;">Descuento global(-)</td>
            <td style="padding:6px 12px;font-size:10px;color:#dc2626;text-align:right;border-bottom:1px solid #f1f5f9;">-${this.fmt(c.descuento)}</td>
          </tr>` : ''}
          <tr>
            <td style="padding:8px 12px;font-size:11px;font-weight:800;color:#000000;background:#efefef;">Total Compra</td>
            <td style="padding:8px 12px;font-size:12px;color:#000000;text-align:right;background:#efefef;font-weight:800;">${this.fmt(c.total)}</td>
          </tr>
        </table>
      </td>
    </tr>
    </table>

    <!-- ═══════ PAGO + TIPO OPERACIÓN ═══════ -->
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:8px;">
    <tr>
      <td style="vertical-align:top;width:35%;padding-right:20px;">
        <div style="font-size:10px;font-weight:700;color:#000000;margin-bottom:4px;">Tipo de operación</div>
        <div style="font-size:11px;font-weight:500;color:#475569;">Compra</div>
      </td>
      <td style="vertical-align:top;">
        <div style="font-size:10px;font-weight:700;color:#000000;margin-bottom:4px;">Detalles de pago</div>
        <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <tr>
            <td style="padding:2px 0;font-size:10px;font-weight:800;color:#000000;">Forma de pago</td>
          </tr>
          <tr>
            <td style="padding:0 0 4px;font-size:10px;color:#000000;">${formaPagoLabel}</td>
          </tr>
          <tr>
            <td style="padding:2px 0;font-size:10px;font-weight:800;color:#000000;">Medio de pago</td>
          </tr>
          <tr>
            <td style="padding:0 0 4px;font-size:10px;color:#000000;">${metodoPagoLabel}</td>
          </tr>
          <tr>
            <td style="padding:2px 0;font-size:10px;font-weight:800;color:#000000;">Moneda</td>
          </tr>
          <tr>
            <td style="padding:0 0 4px;font-size:10px;color:#000000;">${this.fmt(c.total)}</td>
          </tr>
          ${c.fechaVencimiento ? `<tr>
            <td style="padding:2px 0;font-size:10px;font-weight:800;color:#000000;">Fecha de vencimiento</td>
          </tr>
          <tr>
            <td style="padding:0 0 4px;font-size:10px;color:#000000;">${this.formatDatePrint(fechaVenc)}</td>
          </tr>` : ''}
        </table>
      </td>
    </tr>
    </table>

  </td>

  <!-- Right side bar -->
  <td style="width:22px;position:relative;">
    <div style="position:absolute;top:63%;left:99%;transform:translate(-50%,-50%) rotate(90deg);color:#000000;font-size:10px;letter-spacing:1px;font-weight:600;white-space:nowrap;">
      Factura de compra generada con software contable propio
    </div>
  </td>
</tr>
</table>

</body>
</html>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  //  PRIVATE — Construir HTML de Nota de Ajuste
  // ══════════════════════════════════════════════════════════════════════
  private buildAdjustmentNoteHtml(n: NotaAjuste, conceptoLabel?: string): string {
    const tipoLabel = n.tipo === 'credito' ? 'NOTA CRÉDITO ELECTRÓNICA' : 'NOTA DÉBITO ELECTRÓNICA';
    const clienteNombre = n.cliente?.razonSocial || `${n.cliente?.nombre} ${n.cliente?.apellido}` || '—';
    const tipoDocLabel = n.cliente?.tipoDocumentoRel?.abreviatura || 'CC/NIT';
    const fechaGen = this.formatDateTimePrint(n.createdAt);
    const fechaVal = n.fechaEnvioDIAN ? this.formatDateTimePrint(n.fechaEnvioDIAN) : fechaGen;

    const itemsRows = n.items.map((item, i) => `
      <tr>
        <td style="text-align:center;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;">${i + 1}</td>
        <td style="padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:9px;font-family:'Courier New',monospace;color:#475569;">${item.articulo?.codigo || ''}</td>
        <td style="padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${item.descripcion || item.articulo?.nombre || ''}</td>
        <td style="text-align:right;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${this.fmt(item.valorUnitario)}</td>
        <td style="text-align:center;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${item.cantidad}</td>
        <td style="text-align:center;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${item.descuento || 0}</td>
        <td style="text-align:center;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${item.porcentajeIVA || 0}%</td>
        <td style="text-align:right;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#1e293b;font-weight:600;">${this.fmt(item.total || 0)}</td>
      </tr>
    `).join('');

    const qrBlock = n.qrCode
      ? `<td style="width:100px;text-align:center;vertical-align:top;padding:6px;">
           <img src="${n.qrCode}" alt="QR DIAN" style="width:88px;height:88px;"/>
         </td>`
      : '';

    const cufeSection = (n.cufe || n.cude)
      ? `<tr><td colspan="2" style="padding:6px 0;">
           <div style="background:#f8fafc;border:1px solid #cbd5e1;padding:6px 10px;font-size:10px;color:#000000;word-break:break-all;text-align:center;">
             ${n.tipo === 'credito' ? 'CUDE' : 'CUDE/CUFE'}: ${n.cufe || n.cude}
           </div>
         </td></tr>`
      : '';

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>${tipoLabel} ${n.prefijo}${n.numero}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:system-ui,-apple-system,'Segoe UI',sans-serif; font-size:11px; color:#1e293b; background:#fff; }

    @media print {
      @page { margin:0; size:A4; }
      body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
      table { page-break-inside:avoid; }
      thead { display:table-header-group; }
    }
  </style>
</head>
<body>

<table cellpadding="0" cellspacing="0" style="width:210mm;min-height:297mm;margin:0 auto;border-collapse:collapse;">
<tr>
  <td style="vertical-align:top;padding:28px 36px 20px 20px;">

    <!-- ═══════ HEADER ═══════ -->
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">
    <tr>
      <td style="width:140px;vertical-align:top;padding-right:16px;">
        <img src="${this.logoApp}" alt="Logo" style="width:100px;height:100px;"/>
      </td>

      <td style="vertical-align:top;text-align:center;">
        <div style="font-size:13px;font-weight:800;color:#000000;text-transform:uppercase;letter-spacing:0.5px;">${tipoLabel}</div>
        <div style="font-size:12px;font-weight:700;color:#000000;margin-top:2px;">NÚMERO ${n.prefijo}${n.numero}</div>
        <div style="margin-top:6px;line-height:1.5;color:#475569;font-size:9.5px;">
          <strong style="color:#334155;">${this.empresa.sucursal}</strong><br/>
          NIT: ${this.empresa.nit}<br/>
          ${this.empresa.telefono}<br/>
          ${this.empresa.email}<br/>
          ${this.empresa.direccion}<br/>
          ${this.empresa.ciudad}
          ${this.empresa.textoAdicional ? '<br/>' + this.empresa.textoAdicional : ''}
        </div>
      </td>
      ${qrBlock}
    </tr>
    </table>

    <!-- ═══════ CLIENT + REF INFO ═══════ -->
    <table cellpadding="0" cellspacing="0" style="width:100%;border:1.5px solid #cbd5e1;border-radius:4px;margin-bottom:16px;border-collapse:separate;overflow:hidden;">
    <tr>
      <td style="vertical-align:top;padding:10px 14px;width:55%;">
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:600;color:#000000;width:90px;">${tipoDocLabel}:</td>
            <td style="padding:3px 0;font-size:10px;color:#334155;">${n.cliente?.numeroDocumento || '—'}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:600;color:#000000;">Cliente:</td>
            <td style="padding:3px 0;font-size:10px;color:#334155;font-weight:500;">${clienteNombre}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:600;color:#000000;">Dirección:</td>
            <td style="padding:3px 0;font-size:10px;color:#334155;">${n.cliente?.direccion || '—'}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:600;color:#000000;">Factura Ref:</td>
            <td style="padding:3px 0;font-size:10px;color:#000000;">${n.facturaOriginalNumero}</td>
          </tr>
        </table>
      </td>

      <td style="vertical-align:top;padding:10px 14px;width:45%;border-left:1.5px solid #cbd5e1;background:#f8fafc;">
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:600;color:#64748b;">Fecha generación:</td>
            <td style="padding:3px 0;font-size:10px;font-weight:500;color:#334155;text-align:right;">${fechaGen}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:600;color:#64748b;">Fecha validación:</td>
            <td style="padding:3px 0;font-size:10px;font-weight:500;color:#334155;text-align:right;">${fechaVal}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:600;color:#000000;text-transform:uppercase;letter-spacing:1px;padding-top:8px;">CONCEPTO:</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:2px 0;font-size:10px;color:#1e293b;font-weight:600;">${conceptoLabel || n.concepto || '—'}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;padding-top:4px;">Motivo detallado:</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:2px 0;font-size:10px;color:#475569;font-weight:500;">${n.motivo || '—'}</td>
          </tr>
        </table>
      </td>
    </tr>
    </table>

    <!-- ═══════ ITEMS TABLE ═══════ -->
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <thead>
        <tr style="background:#efefef;">
          <th style="padding:8px 5px;font-size:9px;font-weight:600;color:#000000;text-transform:uppercase;text-align:center;width:30px;">#</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:600;color:#000000;text-transform:uppercase;text-align:left;">Código</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:600;color:#000000;text-transform:uppercase;text-align:left;">Descripción</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:600;color:#000000;text-transform:uppercase;text-align:right;">Val. Unit</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:600;color:#000000;text-transform:uppercase;text-align:center;">Cant</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:600;color:#000000;text-transform:uppercase;text-align:center;">Desc</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:600;color:#000000;text-transform:uppercase;text-align:center;">IVA</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:600;color:#000000;text-transform:uppercase;text-align:right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- ═══════ OBSERVACIONES + TOTALES ═══════ -->
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:30px;">
      <tr>
        <td style="vertical-align:top;padding-right:16px;width:55%;">
          <div style="border:1px solid #cbd5e1;border-radius:4px;padding:10px;min-height:80px;">
            <div style="font-size:10px;font-weight:600;color:#334155;margin-bottom:4px;">Observaciones</div>
            <div style="font-size:10px;color:#64748b;line-height:1.5;">${n.observaciones || ''}</div>
          </div>
        </td>

        <td style="vertical-align:top;width:45%;">
          <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #cbd5e1;border-radius:4px;border-collapse:separate;overflow:hidden;">
            <tr>
              <td style="padding:6px 12px;font-size:10px;color:#475569;border-bottom:1px solid #f1f5f9;">Subtotal</td>
              <td style="padding:6px 12px;font-size:10px;color:#1e293b;text-align:right;border-bottom:1px solid #f1f5f9;">${this.fmt(n.subtotal)}</td>
            </tr>
            <tr>
              <td style="padding:6px 12px;font-size:10px;color:#475569;border-bottom:1px solid #f1f5f9;">IVA</td>
              <td style="padding:6px 12px;font-size:10px;color:#1e293b;text-align:right;border-bottom:1px solid #f1f5f9;">${this.fmt(n.iva)}</td>
            </tr>
            ${n.descuento > 0 ? `<tr>
              <td style="padding:6px 12px;font-size:10px;color:#475569;border-bottom:1px solid #f1f5f9;">Descuento</td>
              <td style="padding:6px 12px;font-size:10px;color:#dc2626;text-align:right;border-bottom:1px solid #f1f5f9;">-${this.fmt(n.descuento)}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:8px 12px;font-size:11px;font-weight:500;color:#000000;background:#efefef;">Total Ajuste</td>
              <td style="padding:8px 12px;font-size:12px;color:#000000;text-align:right;background:#efefef;font-weight:500;">${this.fmt(n.total)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- ═══════ CUDE ═══════ -->
    ${cufeSection}

  </td>
  <td style="width:22px;position:relative;">
    <div style="position:absolute;top:50%;left:99%;transform:translate(-50%,-50%) rotate(90deg);color:#000000;font-size:10px;letter-spacing:1px;font-weight:600;white-space:nowrap;opacity:0.3;">
      Documento electrónico generado con Factus Software Contable
    </div>
  </td>
</tr>
</table>

</body>
</html>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  //  PRIVATE — Construir HTML de Nota de Ajuste Compra
  // ══════════════════════════════════════════════════════════════════════
  private buildAdjustmentNoteCompraHtml(n: NotaAjusteCompra): string {
    const tipoLabel = n.tipo === 'credito' ? 'NOTA CRÉDITO COMPRA' : 'NOTA DÉBITO COMPRA';
    const proveedorNombre = n.proveedor?.razonSocial?.trim() || n.proveedor?.nombre?.trim() || '—';
    const proveedorNit = n.proveedor?.identificacion || '—';
    const fechaGen = this.formatDateTimePrint(n.createdAt);
    const facturaRef = n.facturaOriginal?.numeroFacturaProveedor || n.facturaOriginalNumero || '—';

    const itemsRows = n.items.map((item, i) => `
      <tr>
        <td style="text-align:center;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;">${i + 1}</td>
        <td style="padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:9px;font-family:'Courier New',monospace;color:#475569;">${item.articulo?.codigo || ''}</td>
        <td style="padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${item.descripcion || item.articulo?.nombre || ''}</td>
        <td style="text-align:right;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${this.fmt(item.valorUnitario)}</td>
        <td style="text-align:center;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${item.cantidad}</td>
        <td style="text-align:center;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${item.descuento || 0}</td>
        <td style="text-align:center;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${item.porcentajeIVA || 0}%</td>
        <td style="text-align:right;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#1e293b;font-weight:600;">${this.fmt(item.total || 0)}</td>
      </tr>
    `).join('');

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>${tipoLabel} ${n.prefijo || ''}${n.numeroCompleto || n.id}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family:system-ui,-apple-system,'Segoe UI',sans-serif; font-size:11px; color:#1e293b; background:#fff; }

    @media print {
      @page { margin:0; size:A4; }
      body { -webkit-print-color-adjust:exact; print-color-adjust:exact; }
      table { page-break-inside:avoid; }
      thead { display:table-header-group; }
    }
  </style>
</head>
<body>

<table cellpadding="0" cellspacing="0" style="width:210mm;min-height:297mm;margin:0 auto;border-collapse:collapse;">
<tr>
  <td style="vertical-align:top;padding:28px 36px 20px 20px;">

    <!-- ═══════ HEADER ═══════ -->
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">
    <tr>
      <td style="width:140px;vertical-align:top;padding-right:16px;">
        <img src="${this.logoApp}" alt="Logo" style="width:100px;height:100px;"/>
      </td>

      <td style="vertical-align:top;text-align:center;">
        <div style="font-size:13px;font-weight:800;color:#000000;text-transform:uppercase;letter-spacing:0.5px;">${tipoLabel}</div>
        <div style="font-size:12px;font-weight:700;color:#000000;margin-top:2px;">NÚMERO ${n.prefijo || ''}${n.numeroCompleto || n.id}</div>
        <div style="margin-top:6px;line-height:1.5;color:#475569;font-size:9.5px;">
          <strong style="color:#334155;">${this.empresa.sucursal}</strong><br/>
          NIT: ${this.empresa.nit}<br/>
          ${this.empresa.telefono}<br/>
          ${this.empresa.email}<br/>
          ${this.empresa.direccion}<br/>
          ${this.empresa.ciudad}
          ${this.empresa.textoAdicional ? '<br/>' + this.empresa.textoAdicional : ''}
        </div>
      </td>
    </tr>
    </table>

    <!-- ═══════ PROVEEDOR + REF INFO ═══════ -->
    <table cellpadding="0" cellspacing="0" style="width:100%;border:1.5px solid #cbd5e1;border-radius:4px;margin-bottom:16px;border-collapse:separate;overflow:hidden;">
    <tr>
      <td style="vertical-align:top;padding:10px 14px;width:55%;">
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:600;color:#000000;width:90px;">NIT:</td>
            <td style="padding:3px 0;font-size:10px;color:#334155;">${proveedorNit}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:600;color:#000000;">Proveedor:</td>
            <td style="padding:3px 0;font-size:10px;color:#334155;font-weight:500;">${proveedorNombre}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:600;color:#000000;">Dirección:</td>
            <td style="padding:3px 0;font-size:10px;color:#334155;">${n.proveedor?.direccion || '—'}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:600;color:#000000;">Teléfono:</td>
            <td style="padding:3px 0;font-size:10px;color:#334155;">${n.proveedor?.telefono || '—'}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:600;color:#000000;">Email:</td>
            <td style="padding:3px 0;font-size:10px;color:#334155;">${n.proveedor?.email || '—'}</td>
          </tr>
        </table>
      </td>

      <td style="vertical-align:top;padding:10px 14px;width:45%;border-left:1.5px solid #cbd5e1;background:#f8fafc;">
        <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:600;color:#64748b;">Fecha generación:</td>
            <td style="padding:3px 0;font-size:10px;font-weight:500;color:#334155;text-align:right;">${fechaGen}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:600;color:#64748b;">Fecha nota:</td>
            <td style="padding:3px 0;font-size:10px;font-weight:500;color:#334155;text-align:right;">${this.formatDatePrint(n.fecha)}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:10px;font-weight:600;color:#000000;text-transform:uppercase;letter-spacing:1px;padding-top:8px;">FACTURA REF:</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:2px 0;font-size:10px;color:#1e293b;font-weight:600;">${facturaRef}</td>
          </tr>
          <tr>
            <td style="padding:3px 0;font-size:10px;color:#64748b;text-transform:uppercase;letter-spacing:1px;padding-top:4px;">Motivo:</td>
          </tr>
          <tr>
            <td colspan="2" style="padding:2px 0;font-size:10px;color:#475569;font-weight:500;">${n.motivo || '—'}</td>
          </tr>
        </table>
      </td>
    </tr>
    </table>

    <!-- ═══════ ITEMS TABLE ═══════ -->
    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:16px;">
      <thead>
        <tr style="background:#efefef;">
          <th style="padding:8px 5px;font-size:9px;font-weight:600;color:#000000;text-transform:uppercase;text-align:center;width:30px;">#</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:600;color:#000000;text-transform:uppercase;text-align:left;">Código</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:600;color:#000000;text-transform:uppercase;text-align:left;">Descripción</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:600;color:#000000;text-transform:uppercase;text-align:right;">Val. Unit</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:600;color:#000000;text-transform:uppercase;text-align:center;">Cant</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:600;color:#000000;text-transform:uppercase;text-align:center;">Desc</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:600;color:#000000;text-transform:uppercase;text-align:center;">IVA</th>
          <th style="padding:8px 5px;font-size:9px;font-weight:600;color:#000000;text-transform:uppercase;text-align:right;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
      </tbody>
    </table>

    <!-- ═══════ OBSERVACIONES + TOTALES ═══════ -->
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:30px;">
      <tr>
        <td style="vertical-align:top;padding-right:16px;width:55%;">
          <div style="border:1px solid #cbd5e1;border-radius:4px;padding:10px;min-height:80px;">
            <div style="font-size:10px;font-weight:600;color:#334155;margin-bottom:4px;">Observaciones</div>
            <div style="font-size:10px;color:#64748b;line-height:1.5;">${n.observaciones || ''}</div>
          </div>
        </td>

        <td style="vertical-align:top;width:45%;">
          <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #cbd5e1;border-radius:4px;border-collapse:separate;overflow:hidden;">
            <tr>
              <td style="padding:6px 12px;font-size:10px;color:#475569;border-bottom:1px solid #f1f5f9;">Subtotal</td>
              <td style="padding:6px 12px;font-size:10px;color:#1e293b;text-align:right;border-bottom:1px solid #f1f5f9;">${this.fmt(n.subtotal)}</td>
            </tr>
            <tr>
              <td style="padding:6px 12px;font-size:10px;color:#475569;border-bottom:1px solid #f1f5f9;">IVA</td>
              <td style="padding:6px 12px;font-size:10px;color:#1e293b;text-align:right;border-bottom:1px solid #f1f5f9;">${this.fmt(n.iva)}</td>
            </tr>
            ${n.descuento > 0 ? `<tr>
              <td style="padding:6px 12px;font-size:10px;color:#475569;border-bottom:1px solid #f1f5f9;">Descuento</td>
              <td style="padding:6px 12px;font-size:10px;color:#dc2626;text-align:right;border-bottom:1px solid #f1f5f9;">-${this.fmt(n.descuento)}</td>
            </tr>` : ''}
            <tr>
              <td style="padding:8px 12px;font-size:11px;font-weight:500;color:#000000;background:#efefef;">Total Ajuste</td>
              <td style="padding:8px 12px;font-size:12px;color:#000000;text-align:right;background:#efefef;font-weight:500;">${this.fmt(n.total)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

  </td>
  <td style="width:22px;position:relative;">
    <div style="position:absolute;top:50%;left:99%;transform:translate(-50%,-50%) rotate(90deg);color:#000000;font-size:10px;letter-spacing:1px;font-weight:600;white-space:nowrap;opacity:0.3;">
      Documento generado con software contable propio
    </div>
  </td>
</tr>
</table>

</body>
</html>`;
  }

  // ══════════════════════════════════════════════════════════════════════
  //  PRIVATE — Helpers
  // ══════════════════════════════════════════════════════════════════════
  private fmt(value: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value ?? 0);
  }

  private formatDatePrint(date: string | Date): string {
    if (!date) return '—';
    // Evitar que JS reste un día al interpretar YYYY-MM-DD como UTC
    const d = typeof date === 'string' && date.includes('-') && !date.includes('T')
      ? new Date(date.replace(/-/g, '\/'))
      : new Date(date);

    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  private formatDateTimePrint(date: string | Date): string {
    if (!date) return '—';
    // Evitar que JS reste un día al interpretar YYYY-MM-DD como UTC
    const d = typeof date === 'string' && date.includes('-') && !date.includes('T')
      ? new Date(date.replace(/-/g, '\/'))
      : new Date(date);

    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    const ampm = d.getHours() >= 12 ? 'PM' : 'AM';
    return `${dd}-${mm}-${yyyy} ${hh}:${mi}:${ss} ${ampm}`;
  }
}
