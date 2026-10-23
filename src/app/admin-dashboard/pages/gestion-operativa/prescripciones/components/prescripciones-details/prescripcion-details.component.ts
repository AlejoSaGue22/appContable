import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { EmpresaService } from '@dashboard/services/empresa.service';
import { PrescripcionesService } from '@dashboard/pages/ventas/services/prescripciones.service';
import { Prescripcion } from '@dashboard/pages/ventas/interfaces/prescripcion.interface';
import { PrintService } from '@shared/services/print.service';

import { NotificationService } from '@shared/services/notification.service';
import { HelpersUtils } from '@utils/helpers.utils';

@Component({
  standalone: true,
  imports: [CommonModule, DatePipe, RouterLink],
  templateUrl: './prescripcion-details.component.html',
  styles: [`
    .print-sheet {
      max-width: 920px;
      margin: auto;
    }
    @media print {
      body {
        background: white !important;
        color: black !important;
      }
      .no-print {
        display: none !important;
      }
      .print-sheet {
        box-shadow: none !important;
        border: none !important;
        max-width: 100% !important;
        padding: 0 !important;
        margin: 0 !important;
      }
      .print-border {
        border-color: #cbd5e1 !important;
      }
    }
  `]
})
export class PrescripcionDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(PrescripcionesService);
  private readonly empresaService = inject(EmpresaService);
  private readonly printService = inject(PrintService);
  private readonly notify = inject(NotificationService);

  item = signal<Prescripcion | null>(null);
  company = signal<any>(null);
  history = signal<Prescripcion[]>([]);
  copied = signal(false);
  firmaProfesional = signal<string>('');

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    try {
      const result = await firstValueFrom(this.service.get(id));
      this.item.set(result.data);

      const c: any = result.data.cliente;
      if (c?.id) {
        const history = await firstValueFrom(this.service.history(c.id));
        this.history.set(history.data.filter((h: any) => h.id !== id));
      }
      const rawFirma = this.item()?.profesional?.firmaUrl?.trim();
      this.firmaProfesional.set(
        rawFirma && !rawFirma.includes('logo_app') ? HelpersUtils.resolveLogoUrl(rawFirma) : ''
      );

      this.empresaService.getEmpresa().subscribe((r: any) => {
        this.company.set({ ...r.data, logoUrlFormated: HelpersUtils.resolveLogoUrl(r.data.logoUrl) });
      });
    } catch (error) {
      console.error('Error al cargar la prescripción:', error);
      this.notify.error('No se pudo cargar la información de la prescripción', 'Error');
    }
  }

  patientName(): string {
    const c: any = this.item()?.cliente;
    return c?.razonSocial || `${c?.nombre || ''} ${c?.apellido || ''}`.trim() || 'Sin paciente';
  }

  patientDoc(): string {
    const c = this.item()?.cliente;
    if (!c?.numeroDocumento) return '—';
    const abrev = c.tipoDocumentoRel?.abreviatura;
    return abrev ? `${abrev} ${c.numeroDocumento}` : c.numeroDocumento;
  }

  patientPhone(): string {
    return this.item()?.cliente?.telefono || '—';
  }

  patientEmail(): string {
    return this.item()?.cliente?.email || '—';
  }

  patientInitials(): string {
    const name = this.patientName();
    if (!name || name === 'Sin paciente') return 'PA';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  typeLabel(): string {
    const value = this.item()?.tipoLente;
    return value === 'OFTALMICO' ? 'Lente Oftálmico' : value === 'CONTACTO' ? 'Lente de Contacto' : 'Especializado';
  }

  formatDiopter(val: any): string {
    if (val === null || val === undefined || val === '') return '—';
    const num = Number(val);
    if (isNaN(num)) return String(val);
    if (num > 0) return `+${num.toFixed(2)}`;
    if (num === 0) return '0.00 (Neutro)';
    return num.toFixed(2);
  }

  formatAxis(val: any): string {
    if (val === null || val === undefined || val === '') return '—';
    return `${val}°`;
  }

  hasLensometry(): boolean {
    const l = this.item()?.lensometria;
    return !!(l?.derecho?.esfera || l?.derecho?.cilindro || l?.izquierdo?.esfera || l?.izquierdo?.cilindro);
  }

  get contactData(): any {
    return this.item()?.datosContacto || {};
  }

  copyFormula() {
    const p = this.item();
    if (!p) return;
    const od = p.ojoDerecho;
    const oi = p.ojoIzquierdo;
    const text = `PRESCIPCIÓN ÓPTICA ${p.numero} - ${this.patientName()}
OD: Sph ${this.formatDiopter(od?.esfera)} | Cyl ${this.formatDiopter(od?.cilindro)} | Eje ${this.formatAxis(od?.eje)} | Add ${this.formatDiopter(od?.adicion)} | AV ${od?.agudezaLejana || '—'}
OI: Sph ${this.formatDiopter(oi?.esfera)} | Cyl ${this.formatDiopter(oi?.cilindro)} | Eje ${this.formatAxis(oi?.eje)} | Add ${this.formatDiopter(oi?.adicion)} | AV ${oi?.agudezaLejana || '—'}
Tipo: ${this.typeLabel()} | Material: ${p.material || '—'} | Filtros: ${p.filtroTratamiento || '—'}`;

    navigator.clipboard.writeText(text).then(() => {
      this.copied.set(true);
      this.notify.success('Fórmula copiada al portapapeles', 'Copiado');
      setTimeout(() => this.copied.set(false), 2500);
    }).catch(() => {
      this.notify.error('No se pudo copiar la fórmula', 'Error');
    });
  }

  print() {
    const p = this.item();
    if (!p) return;
    this.printService.printPrescripcion(p, this.company());
  }
}
