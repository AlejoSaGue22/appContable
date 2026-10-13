import { Injectable, inject } from '@angular/core';
import { GetFacturaRequest } from '@dashboard/interfaces/documento-venta-interface';
import { FacturaCompraResponse } from '@dashboard/interfaces/factura-compra-interface';
import { DocumentoSoporte } from '@dashboard/interfaces/documento-soporte-interface';
import { NotaAjuste } from '@dashboard/interfaces/notas-ajuste-interface';
import { NotaAjusteCompra } from '@dashboard/interfaces/notas-ajuste-compra-interface';
import { Prescripcion } from '@dashboard/pages/ventas/interfaces/prescripcion.interface';
import { HelpersUtils } from '@utils/helpers.utils';
import { EmpresaService } from '@dashboard/services/empresa.service';

export interface EmpresaInfo {
  nombre: string;
  nit: string;
  telefono: string;
  email: string;
  direccion: string;
  ciudad: string;
  sucursal: string;
  logoUrl?: string;
  textoAdicional?: string;
}

/** Constantes por defecto en caso de fallback */
const EMPRESA_DEFAULT: EmpresaInfo = {
  nombre: 'Factus',
  nit: '901724254-1',
  telefono: '3001234567',
  email: 'ventas@miempresa.com',
  direccion: 'Calle 123',
  ciudad: 'San Gil - Santander',
  sucursal: 'Sucursal Principal',
  textoAdicional: '',
};

@Injectable({ providedIn: 'root' })
export class PrintService {
  private empresaService = inject(EmpresaService);
  private empresa: EmpresaInfo = EMPRESA_DEFAULT;
  private logoApp = `/${HelpersUtils.logoApp}`;
  private nameApp = HelpersUtils.nameApp;

  constructor() {
    this.cargarEmpresa();
  }

  public cargarEmpresa(): void {
    this.empresaService.getEmpresa().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const d = res.data;
          const formattedLogoUrl = HelpersUtils.resolveLogoUrl(d.logoUrl);

          this.empresa = {
            nombre: d.razonSocial || EMPRESA_DEFAULT.nombre,
            nit: d.nit || EMPRESA_DEFAULT.nit,
            telefono: d.telefono || EMPRESA_DEFAULT.telefono,
            email: d.email || EMPRESA_DEFAULT.email,
            direccion: d.direccion || EMPRESA_DEFAULT.direccion,
            ciudad: 'Colombia',
            sucursal: 'Principal',
            logoUrl: formattedLogoUrl,
            textoAdicional: '',
          };
          if (d.logoUrl) {
            this.logoApp = formattedLogoUrl;
          }
          if (d.razonSocial) {
            this.nameApp = d.razonSocial;
          }
        }
      },
      error: () => { }
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // IMPRIMIR FACTURA DE VENTA
  // ──────────────────────────────────────────────────────────────────────
  printInvoice(factura: GetFacturaRequest): Promise<void> {
    return this.buildInvoiceHtml(factura).then((html) => {
      this.openPrintWindow(html, `Factura ${factura.comprobante_completo}`);
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // IMPRIMIR ASIENTO CONTABLE
  // ──────────────────────────────────────────────────────────────────────
  printAsientoContable(asientos: any[], facturaRef: string, tercero: string): void {
    const html = this.buildAsientoHtml(asientos, facturaRef, tercero);
    this.openPrintWindow(html, `Asiento ${facturaRef}`);
  }

  // ──────────────────────────────────────────────────────────────────────
  // IMPRIMIR FACTURA DE COMPRA
  // ──────────────────────────────────────────────────────────────────────
  printPurchaseInvoice(compra: FacturaCompraResponse | DocumentoSoporte, titulo?: string): Promise<void> {
    return this.buildPurchaseInvoiceHtml(compra, titulo).then((html) => {
      this.openPrintWindow(html, `Compra ${compra.numero}`);
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // IMPRIMIR NOTA DE AJUSTE (CRÉDITO/DÉBITO)
  // ──────────────────────────────────────────────────────────────────────
  printAdjustmentNote(nota: NotaAjuste, conceptoLabel?: string): Promise<void> {
    return this.buildAdjustmentNoteHtml(nota, conceptoLabel).then((html) => {
      const title = nota.tipo === 'credito' ? 'Nota Crédito' : 'Nota Débito';
      this.openPrintWindow(html, `${title} ${nota.prefijo}${nota.numero}`);
    });
  }

  // ──────────────────────────────────────────────────────────────────────
  // IMPRIMIR NOTA DE AJUSTE COMPRA (CRÉDITO/DÉBITO)
  // ──────────────────────────────────────────────────────────────────────
  printAdjustmentNoteCompra(nota: NotaAjusteCompra, tituloTipo?: string): void {
    const html = this.buildAdjustmentNoteCompraHtml(nota, tituloTipo);
    const title =
      nota.tipo === 'credito' ? 'Nota Crédito Compra' : 'Nota Débito Compra';
    this.openPrintWindow(
      html,
      `${tituloTipo || title} ${nota.prefijo || ''}${nota.numeroCompleto || nota.id}`,
    );
  }

  // ──────────────────────────────────────────────────────────────────────
  // IMPRIMIR PRESCRIPCIÓN ÓPTICA
  // ──────────────────────────────────────────────────────────────────────
  printPrescripcion(prescripcion: Prescripcion, empresaCustom?: any): void {
    const html = this.buildPrescripcionHtml(prescripcion, empresaCustom);
    this.openPrintWindow(html, `Prescripción ${prescripcion.numero}`);
  }

  // ══════════════════════════════════════════════════════════════════════
  // PRIVATE — Abrir ventana de impresión
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
  // PRIVATE — Construir HTML de Factura
  // ══════════════════════════════════════════════════════════════════════
  private async buildInvoiceHtml(f: GetFacturaRequest): Promise<string> {
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
 `,
    ).join('');

    const qrRaw = HelpersUtils.resolveQrText(f);
    const qrDataUrl = qrRaw ? await HelpersUtils.toQrDataUrl(qrRaw) : null;
    const qrBlock = qrDataUrl ? `<td style="width:100px;text-align:center;vertical-align:top;padding:6px;">
  <img src="${qrDataUrl}" alt="QR DIAN" style="width:88px;height:88px;"/>
  </td>` : (qrRaw ? `<td style="width:100px;text-align:center;vertical-align:top;padding:6px;">
  <div style="font-size:7px;color:#64748b;word-break:break-all;max-width:100px;">${this.escapeHtml(qrRaw)}</div>
  </td>` : '');

    const cufeSection = f.cufe ? `<tr><td colspan="2" style="padding:6px 0;">
 <div style="background:#f8fafc;border:1px solid #cbd5e1;padding:6px 10px;font-size:10px;color:#000000;word-break:break-all;text-align:center;">
 CUFE: ${f.cufe}
 </div>
 </td></tr>` : '';

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
 ${f.iva > 0
        ? `<tr>
 <td style="padding:6px 12px;font-size:10px;color:#475569;border-bottom:1px solid #f1f5f9;">IVA</td>
 <td style="padding:6px 12px;font-size:10px;color:#1e293b;text-align:right;border-bottom:1px solid #f1f5f9;">${this.fmt(f.iva)}</td>
 </tr>`
        : ''
      }
 ${f.descuento > 0
        ? `<tr>
 <td style="padding:6px 12px;font-size:10px;color:#475569;border-bottom:1px solid #f1f5f9;">Descuento global(-)</td>
 <td style="padding:6px 12px;font-size:10px;color:#dc2626;text-align:right;border-bottom:1px solid #f1f5f9;">-${this.fmt(f.descuento)}</td>
 </tr>`
        : ''
      }
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
  // PRIVATE — Construir HTML de Asiento Contable
  // ══════════════════════════════════════════════════════════════════════
  private buildAsientoHtml(asientos: any[], facturaRef: string, tercero: string): string {
    const asientosHtml = asientos
      .map((asiento) => {
        const detallesRows = asiento.detalles
          .map(
            (d: any) => `
            <tr>
            <td class="tercero">${tercero}</td>
            <td>${d.cuenta?.nombre || '—'}</td>
            <td>${d.descripcion || '—'}</td>
            <td class="right debito">${d.debito > 0 ? this.fmt(d.debito) : ''}</td>
            <td class="right credito">${d.credito > 0 ? this.fmt(d.credito) : ''}</td>
            </tr>
            `,
          )
          .join('');

        return `
            <div class="asiento-card">
            <!-- Header -->
            <div class="asiento-header">
            <div class="header-side">Asiento contable</div>
            <div class="header-center">
            <img src="${this.logoApp}" alt="Logo" style="width:64px;height:64px;object-fit:contain;margin:0 auto 6px;display:block;"/>
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
      })
      .join('<div class="page-break"></div>');

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
 /* page-break-after:always; */
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
  // PRIVATE — Construir HTML de Factura de Compra
  // ══════════════════════════════════════════════════════════════════════
  private async buildPurchaseInvoiceHtml(c: FacturaCompraResponse | DocumentoSoporte, titulo?: string): Promise<string> {
    const tituloDoc = (titulo || 'Factura de compra').toUpperCase();
    const proveedorNombre = c.proveedor.razonSocial?.trim() || c.proveedor.nombre?.trim() || '—';
    const proveedorNit = c.proveedor.identificacion || '—';
    const fechaGen = this.formatDateTimePrint(c.createdAt);
    const fechaVenc = c.fechaVencimiento || c.fecha;

    const isElectronico = 'tipo' in c && c.tipo === 'electronico';
    const qrRaw = isElectronico ? HelpersUtils.resolveQrText(c) : null;
    const qrDataUrl = qrRaw ? await HelpersUtils.toQrDataUrl(qrRaw) : null;
    const qrBlock = qrDataUrl ? `<td style="width:100px;text-align:center;vertical-align:top;padding:6px;">
  <img src="${qrDataUrl}" alt="QR DIAN" style="width:88px;height:88px;"/>
  </td>` : (qrRaw ? `<td style="width:100px;text-align:center;vertical-align:top;padding:6px;">
  <div style="font-size:7px;color:#64748b;word-break:break-all;max-width:100px;">${this.escapeHtml(qrRaw)}</div>
  </td>` : '');

    const itemsRows = c.items.map((item, i) => `<tr>
 <td style="text-align:center;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;">${i + 1}</td>
 <td style="padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:9px;font-family:'Courier New',monospace;color:#475569;">${item.articulo?.codigo || ''}</td>
 <td style="padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${item.descripcion || item.articulo?.nombre || ''}</td>
 <td style="text-align:right;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${this.fmt(item.unitPrice)}</td>
 <td style="text-align:center;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${item.quantity}</td>
 <td style="text-align:center;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${item.descuento || 0}</td>
 <td style="text-align:center;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${item.porcentajeIva || 0}%</td>
 <td style="text-align:right;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#1e293b;font-weight:600;">${this.fmt(item.itemTotal || 0)}</td>
 </tr>`).join('');

    const formaPagoLabel = c.formaPago === 'CONTADO' ? 'Pago de contado' : 'Pago a crédito';
    const metodoPagoLabel = c.metodoPagoRel?.nombre || c.metodoPago || '—';

    return `<!DOCTYPE html>
<html lang="es">
<head>
 <meta charset="UTF-8"/>
  <title>${tituloDoc} ${c.numero}</title>
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
  <div style="font-size:13px;font-weight:800;color:#000000;text-transform:uppercase;letter-spacing:0.5px;">${tituloDoc}</div>
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

 <!-- Right: QR Code -->
 ${qrBlock}
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
 ${c.fechaVencimiento
        ? `<tr>
 <td style="padding:3px 0;font-size:10px;font-weight:600;color:#64748b;">Fecha de vencimiento:</td>
 <td style="padding:3px 0;font-size:10px;font-weight:500;color:#334155;text-align:right;">${this.formatDatePrint(fechaVenc)}</td>
 </tr>`
        : ''
      }
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
 ${c.iva > 0
        ? `<tr>
 <td style="padding:6px 12px;font-size:10px;color:#475569;border-bottom:1px solid #f1f5f9;">IVA</td>
 <td style="padding:6px 12px;font-size:10px;color:#1e293b;text-align:right;border-bottom:1px solid #f1f5f9;">${this.fmt(c.iva)}</td>
 </tr>`
        : ''
      }
 ${c.descuento > 0
        ? `<tr>
 <td style="padding:6px 12px;font-size:10px;color:#475569;border-bottom:1px solid #f1f5f9;">Descuento global(-)</td>
 <td style="padding:6px 12px;font-size:10px;color:#dc2626;text-align:right;border-bottom:1px solid #f1f5f9;">-${this.fmt(c.descuento)}</td>
 </tr>`
        : ''
      }
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
 ${c.fechaVencimiento
        ? `<tr>
 <td style="padding:2px 0;font-size:10px;font-weight:800;color:#000000;">Fecha de vencimiento</td>
 </tr>
 <tr>
 <td style="padding:0 0 4px;font-size:10px;color:#000000;">${this.formatDatePrint(fechaVenc)}</td>
 </tr>`
        : ''
      }
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
  // PRIVATE — Construir HTML de Nota de Ajuste
  // ══════════════════════════════════════════════════════════════════════
  private async buildAdjustmentNoteHtml(
    n: NotaAjuste,
    conceptoLabel?: string,
  ): Promise<string> {
    const tipoLabel =
      n.tipo === 'credito'
        ? 'NOTA CRÉDITO ELECTRÓNICA'
        : 'NOTA DÉBITO ELECTRÓNICA';
    const clienteNombre =
      n.cliente?.razonSocial ||
      `${n.cliente?.nombre} ${n.cliente?.apellido}` ||
      '—';
    const tipoDocLabel = n.cliente?.tipoDocumentoRel?.abreviatura || 'CC/NIT';
    const fechaGen = this.formatDateTimePrint(n.createdAt);
    const fechaVal = n.fechaEnvioDIAN
      ? this.formatDateTimePrint(n.fechaEnvioDIAN)
      : fechaGen;

    const itemsRows = n.items
      .map(
        (item, i) => `
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
 `,
      )
      .join('');

    const qrRawNota = HelpersUtils.resolveQrText(n);
    const qrDataUrlNota = qrRawNota ? await HelpersUtils.toQrDataUrl(qrRawNota) : null;
    const qrBlock = qrDataUrlNota ? `<td style="width:100px;text-align:center;vertical-align:top;padding:6px;">
                                        <img src="${qrDataUrlNota}" alt="QR DIAN" style="width:88px;height:88px;"/>
                                    </td>`
      : (qrRawNota ? `<td style="width:100px;text-align:center;vertical-align:top;padding:6px;">
                                                        <div style="font-size:7px;color:#64748b;word-break:break-all;max-width:100px;">${this.escapeHtml(qrRawNota)}</div>
                                                    </td>` : '');

    const cufeSection = n.cufe || n.cude ? `<tr>
                                                <td colspan="2" style="padding:6px 0;">
                                                    <div style="background:#f8fafc;border:1px solid #cbd5e1;padding:6px 10px;font-size:10px;color:#000000;word-break:break-all;text-align:center;">
                                                        ${n.tipo === 'credito' ? 'CUDE' : 'CUDE/CUFE'}: ${n.cufe || n.cude}
                                                    </div>
                                                </td>
                                            </tr>` : '';

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
        ${n.descuento > 0
        ? `<tr>
        <td style="padding:6px 12px;font-size:10px;color:#475569;border-bottom:1px solid #f1f5f9;">Descuento</td>
        <td style="padding:6px 12px;font-size:10px;color:#dc2626;text-align:right;border-bottom:1px solid #f1f5f9;">-${this.fmt(n.descuento)}</td>
        </tr>`
        : ''
      }
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
  // PRIVATE — Construir HTML de Nota de Ajuste Compra
  // ══════════════════════════════════════════════════════════════════════
  private buildAdjustmentNoteCompraHtml(n: NotaAjusteCompra, tituloTipo?: string): string {
    const tipoLabel = tituloTipo?.toUpperCase()
      ?? (n.tipo === 'credito' ? 'NOTA CRÉDITO COMPRA' : 'NOTA DÉBITO COMPRA');
    const proveedorNombre = n.proveedor?.razonSocial?.trim() || n.proveedor?.nombre?.trim() || '—';
    const proveedorNit = n.proveedor?.identificacion || '—';
    const fechaGen = this.formatDateTimePrint(n.createdAt);
    const facturaRef = (n as any).facturaOriginal?.numeroFacturaProveedor
      || (n as any).documentoOriginal?.numeroFacturaProveedor
      || (n as any).facturaOriginalNumero
      || (n as any).documentoOriginalNumero
      || '—';

    const itemsRows = n.items.map((item, i) => `<tr>
              <td style="text-align:center;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#64748b;">${i + 1}</td>
              <td style="padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:9px;font-family:'Courier New',monospace;color:#475569;">${item.articulo?.codigo || ''}</td>
              <td style="padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${item.descripcion || item.articulo?.nombre || ''}</td>
              <td style="text-align:right;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${this.fmt(item.valorUnitario)}</td>
              <td style="text-align:center;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${item.cantidad}</td>
              <td style="text-align:center;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${item.descuento || 0}</td>
              <td style="text-align:center;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#334155;">${item.porcentajeIVA || 0}%</td>
              <td style="text-align:right;padding:7px 5px;border-bottom:1px solid #e2e8f0;font-size:10px;color:#1e293b;font-weight:600;">${this.fmt(item.total || 0)}</td>
              </tr>`).join('');

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
 ${n.descuento > 0
        ? `<tr>
 <td style="padding:6px 12px;font-size:10px;color:#475569;border-bottom:1px solid #f1f5f9;">Descuento</td>
 <td style="padding:6px 12px;font-size:10px;color:#dc2626;text-align:right;border-bottom:1px solid #f1f5f9;">-${this.fmt(n.descuento)}</td>
 </tr>`
        : ''
      }
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
  // PRIVATE — Construir HTML de Prescripción Óptica
  // ══════════════════════════════════════════════════════════════════════
  private buildPrescripcionHtml(p: Prescripcion, empresaCustom?: any): string {
    const emp: EmpresaInfo = {
      nombre: empresaCustom?.razonSocial || empresaCustom?.nombre || this.empresa.nombre,
      nit: empresaCustom?.numeroDocumento || empresaCustom?.nit || this.empresa.nit,
      telefono: empresaCustom?.telefono || this.empresa.telefono,
      email: empresaCustom?.email || this.empresa.email,
      direccion: empresaCustom?.direccion || this.empresa.direccion,
      ciudad: empresaCustom?.ciudad || this.empresa.ciudad || 'Colombia',
      sucursal: empresaCustom?.sucursal || this.empresa.sucursal || 'Principal',
      logoUrl: empresaCustom?.logoUrl ? HelpersUtils.resolveLogoUrl(empresaCustom.logoUrl) : this.empresa.logoUrl,
      textoAdicional: empresaCustom?.textoAdicional || this.empresa.textoAdicional,
    };
    const logo = emp.logoUrl || this.logoApp;

    const c = p.cliente;
    const clienteNombre = c?.razonSocial || `${c?.nombre || ''} ${c?.apellido || ''}`.trim() || 'Sin paciente';
    const tipoDocLabel = c?.tipoDocumentoRel?.abreviatura || c?.tipoDocumento || 'CC/NIT';
    const clienteDoc = c?.numeroDocumento || '—';
    const clienteTel = c?.telefono || '—';
    const clienteDir = c?.direccion || '—';
    const clienteEmail = c?.email || '—';
    const clienteCiudad = c?.ciudadRel?.name || c?.ciudad || '—';

    const fechaExamen = this.formatDatePrint(p.fechaExamen);
    const fechaControl = p.fechaControl ? this.formatDatePrint(p.fechaControl) : 'No programada';
    const profesionalNombre = p.profesional?.nombre || 'Especialista en Optometría';
    const firmaProfesional = p.profesional?.firmaUrl
      ? HelpersUtils.resolveLogoUrl(p.profesional.firmaUrl)
      : '';
    const tipoExamenNombre = p.tipoExamenRel?.nombre || p.tipoExamen || 'Valoración Visual';

    const tipoLenteLabel = p.tipoLente === 'OFTALMICO'
      ? 'Lente Oftálmico'
      : p.tipoLente === 'CONTACTO'
        ? 'Lente de Contacto'
        : (p.tipoLenteDescripcion || p.tipoLente || 'Especializado');

    const fmtDiopter = (val: any): string => {
      if (val === null || val === undefined || val === '') return '—';
      const num = Number(val);
      if (isNaN(num)) return String(val);
      if (num > 0) return `+${num.toFixed(2)}`;
      if (num === 0) return '0.00';
      return num.toFixed(2);
    };

    const fmtAxis = (val: any): string => {
      if (val === null || val === undefined || val === '') return '—';
      return `${val}°`;
    };

    const cd: any = p.datosContacto || {};
    const hasContactData = p.tipoLente === 'CONTACTO' && !!(cd.marca || cd.curvaBase || cd.diametro || cd.frecuenciaReemplazo || cd.materialContacto || cd.cuidados);

    const l = p.lensometria;
    const hasLensometry = !!(l?.derecho?.esfera || l?.derecho?.cilindro || l?.izquierdo?.esfera || l?.izquierdo?.cilindro);

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Prescripción ${p.numero}</title>
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

<table cellpadding="0" cellspacing="0" style="width:210mm;min-height:297mm;margin:0 auto;border-collapse:collapse;">
<tr>
  <td style="vertical-align:top;padding:28px 36px 20px 20px;">

    <!-- ═══════ HEADER ═══════ -->
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:16px;">
      <tr>
        <!-- Left: Logo -->
        <td style="width:140px;vertical-align:top;padding-right:16px;">
          <div style="font-size:28px;font-weight:800;color:#000000;line-height:1;margin-bottom:4px;letter-spacing:-0.5px;">
            <img src="${logo}" alt="Logo" style="width:100px;height:100px;object-fit:contain;"/>
          </div>
        </td>

        <!-- Center: Empresa info + Título -->
        <td style="vertical-align:top;text-align:center;">
          <div style="font-size:13px;font-weight:800;color:#000000;text-transform:uppercase;letter-spacing:0.5px;">PRESCRIPCIÓN ÓPTICA / FÓRMULA MÉDICA</div>
          <div style="font-size:12px;font-weight:700;color:#000000;margin-top:2px;">NÚMERO ${p.numero}</div>
          <div style="margin-top:6px;line-height:1.5;color:#475569;font-size:9.5px;">
            <strong style="color:#334155;">${emp.nombre}</strong><br/>
            NIT: ${emp.nit}<br/>
            ${emp.telefono}<br/>
            ${emp.email}<br/>
            ${emp.direccion}<br/>
            ${emp.ciudad}
            ${emp.textoAdicional ? '<br/>' + emp.textoAdicional : ''}
          </div>
        </td>

        <!-- Right: Folio badge -->
        <td style="width:130px;vertical-align:top;text-align:right;">
          <div style="border:1.5px solid #cbd5e1;border-radius:4px;padding:8px 10px;background:#f8fafc;text-align:center;">
            <div style="font-size:8.5px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">FOLIO CLÍNICO</div>
            <div style="font-size:10px;font-weight:800;color:#0284c7;margin:3px 0;letter-spacing:0.5px;">${p.numero}</div>
            <div style="font-size:8.5px;color:#475569;margin-bottom:3px;">Fecha: <strong>${fechaExamen}</strong></div>
            <div style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:8.5px;font-weight:700;text-transform:uppercase;background:${p.estado === 'ACTIVA' ? '#dcfce7;color:#166534;' : '#ffe4e6;color:#9f1239;'}">${p.estado}</div>
          </div>
        </td>
      </tr>
    </table>

    <!-- ═══════ CLIENT & CONSULTATION INFO ═══════ -->
    <table cellpadding="0" cellspacing="0" style="width:100%;border:1.5px solid #cbd5e1;border-radius:4px;margin-bottom:16px;border-collapse:separate;overflow:hidden;">
      <tr>
        <!-- Paciente -->
        <td style="vertical-align:top;padding:10px 14px;width:55%;">
          <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:3px 0;font-size:10px;font-weight:700;color:#000000;width:95px;">${tipoDocLabel}:</td>
              <td style="padding:3px 0;font-size:10px;color:#334155;">${clienteDoc}</td>
            </tr>
            <tr>
              <td style="padding:3px 0;font-size:10px;font-weight:700;color:#000000;">Paciente:</td>
              <td style="padding:3px 0;font-size:10px;color:#334155;font-weight:600;">${clienteNombre}</td>
            </tr>
            <tr>
              <td style="padding:3px 0;font-size:10px;font-weight:700;color:#000000;">Teléfono:</td>
              <td style="padding:3px 0;font-size:10px;color:#334155;">${clienteTel}</td>
            </tr>
            <tr>
              <td style="padding:3px 0;font-size:10px;font-weight:700;color:#000000;">Dirección:</td>
              <td style="padding:3px 0;font-size:10px;color:#334155;">${clienteDir}</td>
            </tr>
            <tr>
              <td style="padding:3px 0;font-size:10px;font-weight:700;color:#000000;">Ciudad / Email:</td>
              <td style="padding:3px 0;font-size:10px;color:#334155;">${clienteCiudad !== '—' ? clienteCiudad + ' / ' : ''}${clienteEmail}</td>
            </tr>
          </table>
        </td>

        <!-- Profesional y Consulta -->
        <td style="vertical-align:top;padding:10px 14px;width:45%;border-left:1.5px solid #cbd5e1;background:#f8fafc;">
          <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="padding:3px 0;font-size:10px;font-weight:600;color:#64748b;">Fecha examen:</td>
              <td style="padding:3px 0;font-size:10px;font-weight:600;color:#334155;text-align:right;">${fechaExamen}</td>
            </tr>
            <tr>
              <td style="padding:3px 0;font-size:10px;font-weight:600;color:#64748b;">Profesional tratante:</td>
              <td style="padding:3px 0;font-size:10px;font-weight:600;color:#334155;text-align:right;">${profesionalNombre}</td>
            </tr>
            <tr>
              <td style="padding:3px 0;font-size:10px;font-weight:600;color:#64748b;">Tipo de examen:</td>
              <td style="padding:3px 0;font-size:10px;font-weight:500;color:#334155;text-align:right;">${this.escapeHtml(tipoExamenNombre)}</td>
            </tr>
            <tr>
              <td style="padding:3px 0;font-size:10px;font-weight:600;color:#64748b;">Próximo control:</td>
              <td style="padding:3px 0;font-size:10px;font-weight:600;color:#0284c7;text-align:right;">${fechaControl}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- ═══════ TABLA CLÍNICA DE REFRACCIÓN FINAL ═══════ -->
    <div style="margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">
      <span style="font-size:11px;font-weight:800;color:#0f172a;text-transform:uppercase;letter-spacing:0.5px;">FÓRMULA ÓPTICA FINAL</span>
      <span style="font-size:9.5px;font-weight:700;color:#0369a1;background:#e0f2fe;padding:2px 8px;border-radius:4px;border:1px solid #bae6fd;">${tipoLenteLabel}</span>
    </div>

    <table cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:16px;border:1.5px solid #cbd5e1;border-radius:4px;overflow:hidden;">
      <thead>
        <tr style="background:#efefef;">
          <th style="padding:8px 8px;font-size:9px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.5px;text-align:left;width:120px;border-bottom:1.5px solid #cbd5e1;">Ojo</th>
          <th style="padding:8px 6px;font-size:9px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.5px;text-align:center;border-bottom:1.5px solid #cbd5e1;">Esfera (SPH)</th>
          <th style="padding:8px 6px;font-size:9px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.5px;text-align:center;border-bottom:1.5px solid #cbd5e1;">Cilindro (CYL)</th>
          <th style="padding:8px 6px;font-size:9px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.5px;text-align:center;border-bottom:1.5px solid #cbd5e1;">Eje (AXIS)</th>
          <th style="padding:8px 6px;font-size:9px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.5px;text-align:center;border-bottom:1.5px solid #cbd5e1;">Adición (ADD)</th>
          <th style="padding:8px 6px;font-size:9px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.5px;text-align:center;border-bottom:1.5px solid #cbd5e1;">AV Lejana</th>
          <th style="padding:8px 6px;font-size:9px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.5px;text-align:center;border-bottom:1.5px solid #cbd5e1;">AV Próxima</th>
          <th style="padding:8px 6px;font-size:9px;font-weight:700;color:#000000;text-transform:uppercase;letter-spacing:0.5px;text-align:center;border-bottom:1.5px solid #cbd5e1;">Prisma (Δ)</th>
        </tr>
      </thead>
      <tbody>
        <tr style="background:#f0f9ff;">
          <td style="padding:8px 8px;border-bottom:1px solid #cbd5e1;font-size:10.5px;font-weight:700;color:#0284c7;">
            OD (Ojo Derecho)
          </td>
          <td style="padding:8px 6px;border-bottom:1px solid #cbd5e1;font-size:11.5px;font-weight:700;color:#0f172a;text-align:center;font-family:'Courier New',monospace;">
            ${fmtDiopter(p.ojoDerecho?.esfera)}
          </td>
          <td style="padding:8px 6px;border-bottom:1px solid #cbd5e1;font-size:11.5px;font-weight:700;color:#0f172a;text-align:center;font-family:'Courier New',monospace;">
            ${fmtDiopter(p.ojoDerecho?.cilindro)}
          </td>
          <td style="padding:8px 6px;border-bottom:1px solid #cbd5e1;font-size:11.5px;font-weight:700;color:#0f172a;text-align:center;font-family:'Courier New',monospace;">
            ${fmtAxis(p.ojoDerecho?.eje)}
          </td>
          <td style="padding:8px 6px;border-bottom:1px solid #cbd5e1;font-size:10.5px;font-weight:600;color:#334155;text-align:center;font-family:'Courier New',monospace;">
            ${fmtDiopter(p.ojoDerecho?.adicion)}
          </td>
          <td style="padding:8px 6px;border-bottom:1px solid #cbd5e1;font-size:10.5px;font-weight:600;color:#334155;text-align:center;">
            ${p.ojoDerecho?.agudezaLejana || '—'}
          </td>
          <td style="padding:8px 6px;border-bottom:1px solid #cbd5e1;font-size:10.5px;font-weight:600;color:#334155;text-align:center;">
            ${p.ojoDerecho?.agudezaProxima || '—'}
          </td>
          <td style="padding:8px 6px;border-bottom:1px solid #cbd5e1;font-size:10px;color:#64748b;text-align:center;">
            ${p.ojoDerecho?.prisma || '—'}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 8px;font-size:10.5px;font-weight:700;color:#4f46e5;">
            OI (Ojo Izquierdo)
          </td>
          <td style="padding:8px 6px;font-size:11.5px;font-weight:700;color:#0f172a;text-align:center;font-family:'Courier New',monospace;">
            ${fmtDiopter(p.ojoIzquierdo?.esfera)}
          </td>
          <td style="padding:8px 6px;font-size:11.5px;font-weight:700;color:#0f172a;text-align:center;font-family:'Courier New',monospace;">
            ${fmtDiopter(p.ojoIzquierdo?.cilindro)}
          </td>
          <td style="padding:8px 6px;font-size:11.5px;font-weight:700;color:#0f172a;text-align:center;font-family:'Courier New',monospace;">
            ${fmtAxis(p.ojoIzquierdo?.eje)}
          </td>
          <td style="padding:8px 6px;font-size:10.5px;font-weight:600;color:#334155;text-align:center;font-family:'Courier New',monospace;">
            ${fmtDiopter(p.ojoIzquierdo?.adicion)}
          </td>
          <td style="padding:8px 6px;font-size:10.5px;font-weight:600;color:#334155;text-align:center;">
            ${p.ojoIzquierdo?.agudezaLejana || '—'}
          </td>
          <td style="padding:8px 6px;font-size:10.5px;font-weight:600;color:#334155;text-align:center;">
            ${p.ojoIzquierdo?.agudezaProxima || '—'}
          </td>
          <td style="padding:8px 6px;font-size:10px;color:#64748b;text-align:center;">
            ${p.ojoIzquierdo?.prisma || '—'}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- ═══════ ESPECIFICACIONES TÉCNICAS & MATERIAL ═══════ -->
    <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #cbd5e1;border-radius:4px;margin-bottom:16px;border-collapse:separate;overflow:hidden;background:#f8fafc;">
      <tr>
        <td style="padding:8px 12px;font-size:9.5px;color:#475569;border-right:1px solid #e2e8f0;width:25%;">
          <strong style="color:#0f172a;display:block;margin-bottom:2px;text-transform:uppercase;font-size:8.5px;">Diseño / Tipo</strong>
          ${p.tipoLenteDescripcion || p.tipoLente || '—'}
        </td>
        <td style="padding:8px 12px;font-size:9.5px;color:#475569;border-right:1px solid #e2e8f0;width:25%;">
          <strong style="color:#0f172a;display:block;margin-bottom:2px;text-transform:uppercase;font-size:8.5px;">Uso Indicado</strong>
          ${p.usoIndicado}
        </td>
        <td style="padding:8px 12px;font-size:9.5px;color:#475569;border-right:1px solid #e2e8f0;width:25%;">
          <strong style="color:#0f172a;display:block;margin-bottom:2px;text-transform:uppercase;font-size:8.5px;">Material</strong>
          ${p.material}
        </td>
        <td style="padding:8px 12px;font-size:9.5px;color:#475569;width:25%;">
          <strong style="color:#0f172a;display:block;margin-bottom:2px;text-transform:uppercase;font-size:8.5px;">Filtros / Tratamiento</strong>
          ${p.filtroTratamiento}
        </td>
      </tr>
    </table>

    ${hasContactData ? `
    <!-- ═══════ PARÁMETROS CONTACTO ═══════ -->
    <div style="font-size:10px;font-weight:700;color:#f8fafc;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Parámetros de Adaptación Corneal</div>
    <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #cbd5e1;border-radius:4px;margin-bottom:16px;border-collapse:separate;overflow:hidden;background:#f8fafc;">
      <tr>
        <td style="padding:7px 10px;font-size:9.5px;color:#475569;border-right:1px solid #cbd5e1;width:20%;">
          <strong>Marca:</strong> ${cd.marca || '—'}
        </td>
        <td style="padding:7px 10px;font-size:9.5px;color:#475569;border-right:1px solid #cbd5e1;width:20%;">
          <strong>Curva Base:</strong> ${cd.curvaBase || '—'}
        </td>
        <td style="padding:7px 10px;font-size:9.5px;color:#475569;border-right:1px solid #cbd5e1;width:20%;">
          <strong>Diámetro:</strong> ${cd.diametro || '—'}
        </td>
        <td style="padding:7px 10px;font-size:9.5px;color:#475569;border-right:1px solid #cbd5e1;width:20%;">
          <strong>Reemplazo:</strong> ${cd.frecuenciaReemplazo || '—'}
        </td>
        <td style="padding:7px 10px;font-size:9.5px;color:#475569;width:20%;">
          <strong>Cuidados:</strong> ${cd.cuidados || cd.materialContacto || '—'}
        </td>
      </tr>
    </table>
    ` : ''}

    ${hasLensometry ? `
    <!-- ═══════ LENSOMETRÍA PREVIA ═══════ -->
    <div style="font-size:10px;font-weight:700;color:#f8fafc;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;">Lensometría</div>
    <table cellpadding="0" cellspacing="0" style="width:100%;border:1px solid #cbd5e1;border-radius:4px;margin-bottom:16px;border-collapse:separate;overflow:hidden;background:#f8fafc;">
      <tr>
        <td style="padding:7px 12px;font-size:9.5px;color:#475569;border-right:1px solid #ccfbf1;width:50%;font-family:'Courier New',monospace;">
          <strong>OD Previo:</strong> Sph: ${fmtDiopter(l?.derecho?.esfera)} | Cyl: ${fmtDiopter(l?.derecho?.cilindro)} | Eje: ${fmtAxis(l?.derecho?.eje)}
        </td>
        <td style="padding:7px 12px;font-size:9.5px;color:#475569;width:50%;font-family:'Courier New',monospace;">
          <strong>OI Previo:</strong> Sph: ${fmtDiopter(l?.izquierdo?.esfera)} | Cyl: ${fmtDiopter(l?.izquierdo?.cilindro)} | Eje: ${fmtAxis(l?.izquierdo?.eje)}
        </td>
      </tr>
    </table>
    ` : ''}

    <!-- ═══════ INDICACIONES & OBSERVACIONES ═══════ -->
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
      <tr>
        <td style="vertical-align:top;padding-right:8px;width:50%;">
          <div style="border:1px solid #cbd5e1;border-radius:4px;padding:8px 10px;min-height:65px;">
            <div style="font-size:9.5px;font-weight:700;color:#334155;margin-bottom:3px;text-transform:uppercase;">Indicaciones de Adaptación</div>
            <div style="font-size:9px;color:#475569;line-height:1.45;white-space:pre-line;">${p.indicaciones || 'Ninguna especificada.'}</div>
          </div>
        </td>
        <td style="vertical-align:top;padding-left:8px;width:50%;">
          <div style="border:1px solid #cbd5e1;border-radius:4px;padding:8px 10px;min-height:65px;">
            <div style="font-size:9.5px;font-weight:700;color:#334155;margin-bottom:3px;text-transform:uppercase;">Recomendaciones Visuales</div>
            <div style="font-size:9px;color:#475569;line-height:1.45;white-space:pre-line;">${p.recomendaciones || 'Ninguna especificada.'}</div>
          </div>
        </td>
      </tr>
      ${p.observaciones ? `
      <tr>
        <td colspan="2" style="padding-top:10px;">
          <div style="border:1px solid #cbd5e1;border-radius:4px;padding:8px 10px;">
            <div style="font-size:9.5px;font-weight:700;color:#334155;margin-bottom:3px;text-transform:uppercase;">Observaciones Clínicas / Montaje</div>
            <div style="font-size:9px;color:#475569;line-height:1.45;white-space:pre-line;">${p.observaciones}</div>
          </div>
        </td>
      </tr>
      ` : ''}
    </table>

    <!-- ═══════ FIRMA DEL PROFESIONAL & PIE DE PÁGINA ═══════ -->
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-top:25px;margin-bottom:10px;">
      <tr>
        <td style="vertical-align:bottom;font-size:8.5px;color:#94a3b8;width:55%;line-height:1.4;">
          Documento clínico generado electrónicamente.<br/>
          Válido para formulación y elaboración en laboratorio óptico autorizado.<br/>
          Control sugerido: <strong>${fechaControl}</strong>
        </td>
        <td style="text-align:center;width:45%;vertical-align:bottom;">
          ${firmaProfesional ? `<img src="${this.escapeHtml(firmaProfesional)}" alt="Firma de ${this.escapeHtml(profesionalNombre)}" style="display:block;max-width:180px;max-height:65px;object-fit:contain;margin:0 auto 3px;"/>` : ''}
          <div style="border-bottom:1.5px solid #0f172a;margin:0 auto 4px auto;width:220px;"></div>
          <div style="font-size:10.5px;font-weight:700;color:#0f172a;">${this.escapeHtml(profesionalNombre)}</div>
          <div style="font-size:8.5px;color:#64748b;">${this.escapeHtml(p.profesional?.especialidad || 'Profesional responsable')}${p.profesional?.registroProfesional ? ` · Registro ${this.escapeHtml(p.profesional.registroProfesional)}` : ''}</div>
        </td>
      </tr>
    </table>

  </td>

  <!-- Barra vertical derecha con marca de texto -->
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
  // PRIVATE — Helpers
  // ══════════════════════════════════════════════════════════════════════
  private escapeHtml(value: string): string {
    return (value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

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
    const d =
      typeof date === 'string' && date.includes('-') && !date.includes('T')
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
    const d =
      typeof date === 'string' && date.includes('-') && !date.includes('T')
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
