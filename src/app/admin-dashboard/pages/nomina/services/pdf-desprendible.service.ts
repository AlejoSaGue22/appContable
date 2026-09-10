import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Liquidacion, PeriodoNomina, Empleado } from '../interfaces/nomina.interface';

/**
 * Patrón Builder: Separa la construcción de un objeto complejo (el PDF) de su representación.
 * Permite crear diferentes representaciones o facilitar la lectura de la estructura.
 * Principio SRP (Single Responsibility Principle): Cada método construye una única sección.
 */
class DesprendiblePdfBuilder {
  private doc: jsPDF;
  private startY: number = 20;
  private readonly pageWidth: number;
  private readonly marginX: number = 14;

  // Configuración de paleta de colores empresarial (escala de grises)
  private lightBg = [247, 247, 247] as [number, number, number];
  private borderColor = [200, 200, 200] as [number, number, number];
  private textColor = [40, 40, 40] as [number, number, number];

  constructor(
    private liquidacion: Liquidacion,
    private periodo: PeriodoNomina,
    private empresa: any
  ) {
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
  }

  public buildHeader(): this {
    // Título centrado en su propia fila
    this.doc.setTextColor(0);
    this.doc.setFontSize(13);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('COMPROBANTE DE PAGO DE NÓMINA', this.pageWidth / 2, this.startY, { align: 'center' });

    this.startY += 5;
    this.drawLine();
    this.startY += 6;

    // Fila inferior: Empresa (izquierda) | Periodo (derecha)
    this.doc.setTextColor(0);
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(this.empresa?.razonSocial || 'Empresa', this.marginX, this.startY);

    this.doc.setTextColor(this.textColor[0], this.textColor[1], this.textColor[2]);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`NIT: ${this.empresa?.nit || ''}`, this.marginX, this.startY + 5);

    // Periodo alineado a la derecha
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`Período: ${this.periodo.nombre}`, this.pageWidth - this.marginX, this.startY, { align: 'right' });
    this.doc.text(`Fecha: ${this.periodo.fechaInicio} a ${this.periodo.fechaFin}`, this.pageWidth - this.marginX, this.startY + 5, { align: 'right' });

    this.startY += 10;
    this.drawLine();
    this.startY += 6;
    return this;
  }

  public buildEmployeeInfo(): this {
    const emp = this.liquidacion.empleado as any;
    
    this.doc.setTextColor(0);
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Datos del Empleado', this.marginX, this.startY);
    this.startY += 6;

    this.doc.setTextColor(this.textColor[0], this.textColor[1], this.textColor[2]);
    this.doc.setFont('helvetica', 'normal');
    
    const employeeName = `${emp?.primerNombre || ''} ${emp?.segundoNombre || ''} ${emp?.primerApellido || ''} ${emp?.segundoApellido || ''}`.replace(/\s+/g, ' ').trim();
    
    // Grid 2x2 para los datos del empleado
    const col1X = this.marginX;
    const col2X = col1X + 25;
    const col3X = this.pageWidth / 2;
    const col4X = col3X + 25;

    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Nombre:', col1X, this.startY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(employeeName, col2X, this.startY);

    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Documento:', col3X, this.startY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`${emp?.tipoDocumento || 'CC'} ${emp?.numeroDocumento || ''}`, col4X, this.startY);

    this.startY += 5;

    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Cargo:', col1X, this.startY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(emp?.cargo?.nombre || '', col2X, this.startY);

    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Días liquid.:', col3X, this.startY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(String(this.liquidacion.diasTrabajados), col4X, this.startY);

    this.startY += 5;

    this.doc.setFont('helvetica', 'bold');
    this.doc.text('Dirección:', col1X, this.startY);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(emp?.direccion || '-', col2X, this.startY);

    this.startY += 8;
    return this;
  }

  public buildIngresosTable(): this {
    const ingresosRows: any[] = [];
    if (this.liquidacion.salarioDevengado > 0) ingresosRows.push(['Salario Básico', String(this.liquidacion.diasTrabajados), this.formatMoney(this.liquidacion.salarioDevengado)]);
    if (this.liquidacion.auxilioTransporte > 0) ingresosRows.push(['Auxilio de Transporte', String(this.liquidacion.diasTrabajados), this.formatMoney(this.liquidacion.auxilioTransporte)]);
    if (this.liquidacion.comisiones > 0) ingresosRows.push(['Comisiones', '-', this.formatMoney(this.liquidacion.comisiones)]);
    if (this.liquidacion.totalBonificaciones > 0) ingresosRows.push(['Bonificaciones', '-', this.formatMoney(this.liquidacion.totalBonificaciones)]);
    if (this.liquidacion.totalHorasExtras > 0) ingresosRows.push(['Horas Extras', '-', this.formatMoney(this.liquidacion.totalHorasExtras)]);
    
    ingresosRows.push([{ content: 'TOTAL INGRESOS', styles: { fontStyle: 'bold' } }, '', { content: this.formatMoney(this.liquidacion.totalDevengado), styles: { fontStyle: 'bold' } }]);

    this.startY = this.generateTable('INGRESOS', ['Concepto', 'Cantidad / Días', 'Valor'], ingresosRows, [100, 40, 40]);
    return this;
  }

  public buildDeduccionesTable(): this {
    const deduccionesRows: any[] = [];
    if (this.liquidacion.saludEmpleado > 0) deduccionesRows.push(['Salud (4%)', this.formatMoney(this.liquidacion.ibc), this.formatMoney(this.liquidacion.saludEmpleado)]);
    if (this.liquidacion.pensionEmpleado > 0) deduccionesRows.push(['Pensión (4%)', this.formatMoney(this.liquidacion.ibc), this.formatMoney(this.liquidacion.pensionEmpleado)]);
    if (this.liquidacion.retencionFuente > 0) deduccionesRows.push(['Retención en la Fuente', '-', this.formatMoney(this.liquidacion.retencionFuente)]);
    
    deduccionesRows.push([{ content: 'TOTAL DEDUCCIONES', styles: { fontStyle: 'bold' } }, '', { content: this.formatMoney(this.liquidacion.totalDeducciones), styles: { fontStyle: 'bold' } }]);

    this.startY = this.generateTable('DEDUCCIONES', ['Concepto', 'Base (IBC)', 'Valor'], deduccionesRows, [100, 40, 40]);
    return this;
  }

  public buildNetoPagar(): this {
    this.startY += 10;
    
    // Contenedor para el total neto
    this.doc.setDrawColor(this.borderColor[0], this.borderColor[1], this.borderColor[2]);
    this.doc.setFillColor(this.lightBg[0], this.lightBg[1], this.lightBg[2]);
    this.doc.setLineWidth(0.3);
    
    const boxWidth = 90;
    const boxHeight = 12;
    const boxX = this.pageWidth - this.marginX - boxWidth;
    
    this.doc.rect(boxX, this.startY, boxWidth, boxHeight, 'FD');
    
    this.doc.setTextColor(0);
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('NETO A PAGAR:', boxX + 5, this.startY + 8);
    this.doc.text(this.formatMoney(this.liquidacion.netoPagar), boxX + boxWidth - 5, this.startY + 8, { align: 'right' });

    this.startY += 20;
    return this;
  }



  public buildFooter(): this {
    const footerY = this.doc.internal.pageSize.getHeight() - 35;
    
    this.doc.setDrawColor(this.borderColor[0], this.borderColor[1], this.borderColor[2]);
    this.doc.setLineWidth(0.2);
    
    // Líneas de firma
    this.doc.line(this.marginX + 15, footerY - 15, this.marginX + 75, footerY - 15);
    this.doc.line(this.pageWidth - this.marginX - 75, footerY - 15, this.pageWidth - this.marginX - 15, footerY - 15);
    
    this.doc.setTextColor(0);
    this.doc.setFontSize(8);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text('Firma Empleado', this.marginX + 45, footerY - 10, { align: 'center' });
    this.doc.text('Representante Legal / Empresa', this.pageWidth - this.marginX - 45, footerY - 10, { align: 'center' });

    // Texto legal en el pie de página
    this.doc.line(this.marginX, footerY, this.pageWidth - this.marginX, footerY);
    this.doc.setFontSize(7);
    this.doc.setTextColor(120, 120, 120);
    this.doc.text('Este documento es un soporte válido del pago de nómina.', this.pageWidth / 2, footerY + 5, { align: 'center' });
    this.doc.text(`Generado el ${new Date().toLocaleDateString('es-CO')} - Fintura ERP`, this.pageWidth / 2, footerY + 9, { align: 'center' });

    return this;
  }

  public getResult(): jsPDF {
    return this.doc;
  }

  // --- Utilidades del Builder ---
  private drawLine() {
    this.doc.setDrawColor(this.borderColor[0], this.borderColor[1], this.borderColor[2]);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.marginX, this.startY, this.pageWidth - this.marginX, this.startY);
  }

  private generateTable(title: string, head: string[], body: any[], columnWidths: number[]): number {
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0);
    this.doc.text(title, this.marginX, this.startY);
    
    autoTable(this.doc, {
      startY: this.startY + 3,
      head: [head],
      body: body,
      theme: 'plain',
      styles: {
        fontSize: 8,
        cellPadding: 4,
        lineColor: this.borderColor,
        lineWidth: 0.1,
      },
      headStyles: { 
        fillColor: this.lightBg, 
        textColor: [0,0,0], 
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: this.borderColor
      },
      bodyStyles: {
        textColor: this.textColor
      },
      columnStyles: {
        0: { cellWidth: columnWidths[0] || 'auto' },
        1: { cellWidth: columnWidths[1] || 'auto', halign: head.length === 3 ? 'center' : 'right' },
        2: { cellWidth: columnWidths[2] || 'auto', halign: 'right' },
      },
      didParseCell: (data) => {
        // Estilo especial para la fila de totales
        if (data.row.index === body.length - 1) {
          data.cell.styles.fillColor = this.lightBg;
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    return (this.doc as any).lastAutoTable.finalY + 8;
  }

  private formatMoney(value: number): string {
    return `$${Math.round(value).toLocaleString('es-CO')}`;
  }
}

@Injectable({ providedIn: 'root' })
export class PdfDesprendibleService {

  generarDesprendible(liquidacion: Liquidacion, periodo: PeriodoNomina, empresa: any, asBlob: boolean = false): { blob?: Blob, fileName: string } | void {
    const builder = new DesprendiblePdfBuilder(liquidacion, periodo, empresa);
    
    const doc = builder
      .buildHeader()
      .buildEmployeeInfo()
      .buildIngresosTable()
      .buildDeduccionesTable()
      .buildNetoPagar()

      .buildFooter()
      .getResult();

    const emp = liquidacion.empleado as any;
    const fileName = `Desprendible_${emp?.primerNombre}_${emp?.primerApellido}_${periodo.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;

    if (asBlob) {
      return { blob: doc.output('blob'), fileName };
    }

    doc.save(fileName);
  }
}

