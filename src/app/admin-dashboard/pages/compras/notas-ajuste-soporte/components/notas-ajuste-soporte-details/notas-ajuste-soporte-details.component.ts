import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NotaAjusteSoporte, NotaAjusteSoporteStatus } from '@dashboard/interfaces/notas-ajuste-soporte-interface';
import { NotasAjusteSoporteService } from '@dashboard/pages/compras/services/notas-ajuste-soporte.service';
import { AsientosHttpService } from '@dashboard/services/asientos-http.service';
import { NotificationService } from '@shared/services/notification.service';
import { PrintService } from '@shared/services/print.service';
import { HelpersUtils } from '@utils/helpers.utils';

@Component({
    selector: 'app-notas-ajuste-soporte-details',
    standalone: true,
    imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
    templateUrl: './notas-ajuste-soporte-details.component.html',
})
export class NotasAjusteSoporteDetailsComponent implements OnInit {
    nota = signal<NotaAjusteSoporte | null>(null);
    loading = signal(true);
    error = signal<string | null>(null);
    asientos: any[] = [];
    loadingAsientos = false;
    downloadingPdf = signal(false);

    qrDataUrl = signal<string | null>(null);
    qrRawUrl = signal<string | null>(null);

    private notasService = inject(NotasAjusteSoporteService);
    private route = inject(ActivatedRoute);
    private asientosService = inject(AsientosHttpService);
    private notificationService = inject(NotificationService);
    private printService = inject(PrintService);

    ngOnInit(): void {
        const id = this.route.snapshot.params['id'];
        this.loadNota(id);
    }

    loadNota(id: string): void {
        this.loading.set(true);
        this.error.set(null);

        this.notasService.getNotaAjusteById(id).subscribe({
            next: (response) => {
                this.nota.set(response.data);
                this.resolveQr(response.data);
                this.loading.set(false);
                this.cargarDatosContables();
            },
            error: (err) => {
                this.error.set('Error al cargar la nota de ajuste a soporte');
                this.loading.set(false);
            }
        });
    }

    private resolveQr(n: NotaAjusteSoporte | null): void {
        const raw = HelpersUtils.resolveQrText(n);
        this.qrRawUrl.set(raw);
        this.qrDataUrl.set(null);
        if (raw) {
            void HelpersUtils.toQrDataUrl(raw).then((dataUrl) => {
                if (HelpersUtils.resolveQrText(this.nota()) === raw) {
                    this.qrDataUrl.set(dataUrl);
                }
            });
        }
    }

    descargarPdf(): void {
        const n = this.nota();
        if (!n) return;
        this.downloadingPdf.set(true);
        this.notasService.descargarPdf(n.id).subscribe({
            next: (blob) => {
                this.downloadingPdf.set(false);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${n.numeroCompleto || 'nota-soporte'}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
            },
            error: () => {
                this.downloadingPdf.set(false);
                this.notificationService.error('No se pudo descargar el PDF de la DIAN', 'Error');
            }
        });
    }

    cargarDatosContables(): void {
        const n = this.nota();
        if (!n) return;

        this.loadingAsientos = true;
        const referencia = n.numeroCompleto || `${n.prefijo || ''}-${n.numero || ''}`;

        this.asientosService.getByReferencia(referencia).subscribe({
            next: (a) => {
                this.asientos = a;
                this.loadingAsientos = false;
            },
            error: () => {
                this.loadingAsientos = false;
            },
        });
    }

    getStatusClass(status: NotaAjusteSoporteStatus): string {
        const classes: Record<NotaAjusteSoporteStatus, string> = {
            [NotaAjusteSoporteStatus.DRAFT]: 'bg-gray-100 text-gray-800 border-gray-300',
            [NotaAjusteSoporteStatus.REGISTRADO]: 'bg-green-100 text-green-800 border-green-300',
            [NotaAjusteSoporteStatus.ANULADO]: 'bg-red-50 text-red-500 border-red-100',
            [NotaAjusteSoporteStatus.ERROR_ASIENTO]: 'bg-orange-100 text-orange-800 border-orange-300',
        };
        return classes[status] || 'bg-gray-100 text-gray-800 border-gray-300';
    }

    getStatusLabel(status: NotaAjusteSoporteStatus): string {
        const labels: Record<NotaAjusteSoporteStatus, string> = {
            [NotaAjusteSoporteStatus.DRAFT]: 'Borrador',
            [NotaAjusteSoporteStatus.REGISTRADO]: 'Registrada',
            [NotaAjusteSoporteStatus.ANULADO]: 'Anulada',
            [NotaAjusteSoporteStatus.ERROR_ASIENTO]: 'Error Asiento',
        };
        return labels[status] || status;
    }

    formatDate(date: string | Date): string {
        if (!date) return '—';
        const dateObj = typeof date === 'string' && date.includes('-') && !date.includes('T')
            ? new Date(date.replace(/-/g, '\/'))
            : new Date(date);

        return dateObj.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    printNota(): void {
        const n = this.nota();
        if (n) {
            const titulo = n.tipo === 'credito' ? 'Nota Crédito Soporte' : 'Nota Débito Soporte';
            this.printService.printAdjustmentNoteCompra(n as any, titulo);
        }
    }

    printAsiento(): void {
        const n = this.nota();
        if (n && this.asientos.length > 0) {
            const tercero = n.proveedor ? `${n.proveedor.razonSocial || n.proveedor.nombre + ' ' + n.proveedor.apellido} - ${n.proveedor.identificacion}` : '—';
            this.printService.printAsientoContable(this.asientos, `${n.prefijo || ''}${n.numeroCompleto || n.id}`, tercero);
        }
    }
}
