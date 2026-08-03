import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Liquidacion, PeriodoNomina, Empleado } from '../interfaces/nomina.interface';

@Injectable({ providedIn: 'root' })
export class PdfDesprendibleService {

  generarDesprendible(liquidacion: Liquidacion, periodo: PeriodoNomina, empresa: any) {
    const doc = new jsPDF();
    const emp = liquidacion.empleado as any;
    const pageWidth = doc.internal.pageSize.getWidth();

    // Header - Company info
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(empresa?.razonSocial || 'Fintura', 14, 20);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`NIT: ${empresa?.nit || ''}`, 14, 27);
    doc.text(`Dirección: ${empresa?.direccion || ''}`, 14, 32);
    doc.text(`Teléfono: ${empresa?.telefono || ''}`, 14, 37);

    // Title
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Desprendido de Pago de Nómina', pageWidth / 2, 20, { align: 'center' });

    // Period info
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${periodo.nombre}`, pageWidth - 14, 27, { align: 'right' });
    doc.text(`Fecha: ${periodo.fechaInicio} - ${periodo.fechaFin}`, pageWidth - 14, 32, { align: 'right' });
    doc.text(`Tipo: ${periodo.tipo}`, pageWidth - 14, 37, { align: 'right' });

    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(14, 42, pageWidth - 14, 42);

    // Employee info
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('Empleado:', 14, 50);
    doc.setFont('helvetica', 'normal');
    doc.text(`${emp?.primerNombre || ''} ${emp?.segundoNombre || ''} ${emp?.primerApellido || ''} ${emp?.segundoApellido || ''}`, 40, 50);
    doc.text(`C.C. ${emp?.numeroDocumento || ''}`, 14, 57);
    doc.text(`Cargo: ${emp?.cargo?.nombre || ''}`, 14, 64);
    doc.text(`Días trabajados: ${liquidacion.diasTrabajados}`, pageWidth - 14, 57, { align: 'right' });

    // Ingresos table
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Ingresos', 14, 76);

    const ingresosRows: any[] = [];
    if (liquidacion.salarioDevengado > 0) {
      ingresosRows.push(['Salario Básico', String(liquidacion.diasTrabajados), this.formatMoney(liquidacion.salarioDevengado)]);
    }
    if (liquidacion.auxilioTransporte > 0) {
      ingresosRows.push(['Auxilio de Transporte', String(liquidacion.diasTrabajados), this.formatMoney(liquidacion.auxilioTransporte)]);
    }
    if (liquidacion.comisiones > 0) {
      ingresosRows.push(['Comisiones', '-', this.formatMoney(liquidacion.comisiones)]);
    }
    if (liquidacion.totalBonificaciones > 0) {
      ingresosRows.push(['Bonificaciones', '-', this.formatMoney(liquidacion.totalBonificaciones)]);
    }
    if (liquidacion.totalHorasExtras > 0) {
      ingresosRows.push(['Horas Extras', '-', this.formatMoney(liquidacion.totalHorasExtras)]);
    }
    ingresosRows.push([{ content: 'Total Ingresos', styles: { fontStyle: 'bold' } }, '', { content: this.formatMoney(liquidacion.totalDevengado), styles: { fontStyle: 'bold' } }]);

    autoTable(doc, {
      startY: 80,
      head: [['Concepto', 'Días/Cant.', 'Valor']],
      body: ingresosRows,
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 50, halign: 'right' },
      },
      didParseCell: (data) => {
        if (data.row.index === ingresosRows.length - 1) {
          data.cell.styles.fillColor = [240, 240, 240];
        }
      },
    });

    // Deducciones table
    const deduccionesStartY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Deducciones', 14, deduccionesStartY);

    const deduccionesRows: any[] = [];
    if (liquidacion.saludEmpleado > 0) {
      deduccionesRows.push(['Salud (4%)', this.formatMoney(liquidacion.ibc), `-${this.formatMoney(liquidacion.saludEmpleado)}`]);
    }
    if (liquidacion.pensionEmpleado > 0) {
      deduccionesRows.push(['Pensión (4%)', this.formatMoney(liquidacion.ibc), `-${this.formatMoney(liquidacion.pensionEmpleado)}`]);
    }
    if (liquidacion.retencionFuente > 0) {
      deduccionesRows.push(['Retención en la Fuente', '-', `-${this.formatMoney(liquidacion.retencionFuente)}`]);
    }
    deduccionesRows.push([{ content: 'Total Deducciones', styles: { fontStyle: 'bold' } }, '', { content: `-${this.formatMoney(liquidacion.totalDeducciones)}`, styles: { fontStyle: 'bold', textColor: [220, 38, 38] } }]);

    autoTable(doc, {
      startY: deduccionesStartY + 4,
      head: [['Concepto', 'Base (IBC)', 'Valor']],
      body: deduccionesRows,
      theme: 'grid',
      headStyles: { fillColor: [239, 68, 68], textColor: 255, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 50, halign: 'right' },
        2: { cellWidth: 50, halign: 'right' },
      },
      didParseCell: (data) => {
        if (data.row.index === deduccionesRows.length - 1) {
          data.cell.styles.fillColor = [240, 240, 240];
        }
      },
    });

    // Neto a pagar
    const netoStartY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(14, netoStartY, pageWidth - 28, 14, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('NETO A PAGAR', 20, netoStartY + 9);
    doc.text(this.formatMoney(liquidacion.netoPagar), pageWidth - 20, netoStartY + 9, { align: 'right' });
    doc.setTextColor(0, 0, 0);

    // Aportes empleador
    if (liquidacion.aportesEmpleador && liquidacion.aportesEmpleador.length > 0) {
      const aportesStartY = netoStartY + 22;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Aportes del Empleador', 14, aportesStartY);

      const aportesRows: any[] = liquidacion.aportesEmpleador.map((ap) => [ap.concepto, this.formatMoney(ap.valor)]);
      aportesRows.push([{ content: 'Total Aportes', styles: { fontStyle: 'bold' } }, { content: this.formatMoney(liquidacion.totalAportes), styles: { fontStyle: 'bold' } }]);

      autoTable(doc, {
        startY: aportesStartY + 4,
        head: [['Concepto', 'Valor']],
        body: aportesRows,
        theme: 'grid',
        headStyles: { fillColor: [100, 116, 139], textColor: 255, fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 100 },
          1: { cellWidth: 50, halign: 'right' },
        },
        didParseCell: (data) => {
          if (data.row.index === aportesRows.length - 1) {
            data.cell.styles.fillColor = [240, 240, 240];
          }
        },
      });
    }

    // Footer
    const footerY = doc.internal.pageSize.getHeight() - 30;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, footerY, pageWidth - 14, footerY);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text('Este documento es un comprobante de pago de nómina electrónica.', pageWidth / 2, footerY + 6, { align: 'center' });
    doc.text(`Generado el ${new Date().toLocaleDateString('es-CO')} - Fintura ERP`, pageWidth / 2, footerY + 12, { align: 'center' });

    // Signature lines
    doc.line(20, footerY - 20, 80, footerY - 20);
    doc.line(pageWidth - 80, footerY - 20, pageWidth - 20, footerY - 20);
    doc.text('Firma Empleado', 50, footerY - 15, { align: 'center' });
    doc.text('Representante Legal', pageWidth - 50, footerY - 15, { align: 'center' });

    const fileName = `Desprendido_${emp?.primerNombre}_${emp?.primerApellido}_${periodo.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    doc.save(fileName);
  }

  private formatMoney(value: number): string {
    return `$${Math.round(value).toLocaleString('es-CO')}`;
  }
}
