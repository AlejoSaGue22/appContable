import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { NotaAjuste, NotaAjusteStatus, NotaDianStatus } from '@dashboard/interfaces/notas-ajuste-interface';
import { NotasAjusteService } from '@dashboard/pages/ventas/services/notas-ajuste.service';
import { AsientosHttpService } from '@dashboard/services/asientos-http.service';
import { NotificationService } from '@shared/services/notification.service';
import { PrintService } from '@shared/services/print.service';
import { CatalogsStore } from '@dashboard/services/catalogs.store';
import { LoaderService } from '@utils/services/loader.service';

@Component({
    selector: 'app-notas-ajuste-details',
    standalone: true,
    imports: [CommonModule, RouterLink, CurrencyPipe, DatePipe],
    templateUrl: './notas-ajuste-details.component.html',
})
export class NotasAjusteDetailsComponent {
    nota = signal<NotaAjuste | null>(null);
    loading = signal(true);
    error = signal<string | null>(null);
    asientos: any[] = [];
    loadingAsientos = false;

    private notasService = inject(NotasAjusteService);
    private route = inject(ActivatedRoute);
    private asientosService = inject(AsientosHttpService);
    private notificationService = inject(NotificationService);
    private printService = inject(PrintService);
    private catalogs = inject(CatalogsStore);
    private loaderService = inject(LoaderService);

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
                this.loading.set(false);
                this.cargarDatosContables();
            },
            error: (err) => {
                this.error.set('Error al cargar la nota de ajuste');
                this.loading.set(false);
            }
        });
    }

    cargarDatosContables(): void {
        const n = this.nota();
        if (!n) return;

        this.loadingAsientos = true;
        this.asientosService.getByReferencia(n.numeroCompleto || `${n.prefijo}-${n.numero}`).subscribe({
            next: (a) => {
                this.asientos = a;
                this.loadingAsientos = false;
            },
            error: () => {
                this.loadingAsientos = false;
            },
        });
    }

    getStatusClass(status: NotaAjusteStatus): string {
        const classes: Record<NotaAjusteStatus, string> = {
            [NotaAjusteStatus.DRAFT]: 'bg-gray-100 text-gray-800 border-gray-300',
            [NotaAjusteStatus.ISSUED]: 'bg-teal-100 text-teal-800 border-teal-300',
            [NotaAjusteStatus.PROCESSING]: 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse',
            [NotaAjusteStatus.SENT]: 'bg-blue-100 text-blue-800 border-blue-300',
            [NotaAjusteStatus.ACCEPTED]: 'bg-green-100 text-green-800 border-green-300',
            [NotaAjusteStatus.REJECTED]: 'bg-red-100 text-red-800 border-red-300',
            [NotaAjusteStatus.CANCELLED]: 'bg-red-50 text-red-500 border-red-100',
            [NotaAjusteStatus.ERROR_ASIENTO]: 'bg-orange-100 text-orange-800 border-orange-300',
        };
        return classes[status] || 'bg-gray-100 text-gray-800 border-gray-300';
    }

    getStatusLabel(status: NotaAjusteStatus): string {
        const labels: Record<NotaAjusteStatus, string> = {
            [NotaAjusteStatus.DRAFT]: 'Borrador',
            [NotaAjusteStatus.ISSUED]: 'Emitida',
            [NotaAjusteStatus.PROCESSING]: 'Procesando',
            [NotaAjusteStatus.SENT]: 'Enviada',
            [NotaAjusteStatus.ACCEPTED]: 'Aceptada',
            [NotaAjusteStatus.REJECTED]: 'Rechazada',
            [NotaAjusteStatus.CANCELLED]: 'Anulada',
            [NotaAjusteStatus.ERROR_ASIENTO]: 'Error Asiento',
        };
        return labels[status] || status;
    }

    /** Estado DIAN efectivo: el backend envía `estadoDIAN` (español). */
    getNotaDianStatus(nota: NotaAjuste | null): string {
        return (nota as any)?.estadoDIAN ?? (nota as any)?.dianStatus ?? '';
    }

    getDianStatusClass(status: string): string {
        const classes: Record<string, string> = {
            [NotaDianStatus.PENDIENTE]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            [NotaDianStatus.NO_APLICA]: 'bg-gray-100 text-gray-600 border-gray-200',
            [NotaDianStatus.ENVIADA]: 'bg-blue-50 text-blue-700 border-blue-200',
            [NotaDianStatus.PROCESANDO]: 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse',
            [NotaDianStatus.ACEPTADA]: 'bg-green-100 text-green-800 border-green-300',
            [NotaDianStatus.RECHAZADA]: 'bg-red-100 text-red-800 border-red-300',
            [NotaDianStatus.ANULADA]: 'bg-gray-100 text-gray-800 border-gray-300',
            // Tolerancia a valores legacy en inglés (DianStatus de facturas)
            ['pending']: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            ['sent']: 'bg-blue-50 text-blue-700 border-blue-200',
            ['processing']: 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse',
            ['accepted']: 'bg-green-100 text-green-800 border-green-300',
            ['rejected']: 'bg-red-100 text-red-800 border-red-300',
            ['cancelled']: 'bg-gray-100 text-gray-800 border-gray-300'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    getDianStatusLabel(status: string): string {
        const labels: Record<string, string> = {
            [NotaDianStatus.PENDIENTE]: 'Pendiente envío',
            [NotaDianStatus.NO_APLICA]: 'No aplica',
            [NotaDianStatus.ENVIADA]: 'Enviada',
            [NotaDianStatus.PROCESANDO]: 'Procesando',
            [NotaDianStatus.ACEPTADA]: 'Aceptada por DIAN',
            [NotaDianStatus.RECHAZADA]: 'Rechazada por DIAN',
            [NotaDianStatus.ANULADA]: 'Anulada',
            ['pending']: 'Pendiente envío',
            ['sent']: 'Enviada',
            ['processing']: 'Procesando',
            ['accepted']: 'Aceptada por DIAN',
            ['rejected']: 'Rechazada por DIAN',
            ['cancelled']: 'Anulada'
        };
        return labels[status] || status;
    }

    formatDate(date: string | Date): string {
        if (!date) return '—';
        // Evitar que JS reste un día al interpretar YYYY-MM-DD como UTC
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
            const conceptoLabel = this.getConceptoLabel(n.tipo, n.concepto);
            this.printService.printAdjustmentNote(n, conceptoLabel);
        }
    }

    printAsiento(): void {
        const n = this.nota();
        if (n && this.asientos.length > 0) {
            const tercero = n.cliente ? `${n.cliente.razonSocial || n.cliente.nombre + ' ' + n.cliente.apellido} - ${n.cliente.numeroDocumento}` : '-';
            this.printService.printAsientoContable(this.asientos, `${n.prefijo}${n.numero}`, tercero);
        }
    }

    getConceptoLabel(tipo: string, concepto: string): string {
        const list = tipo === 'credito' ? this.catalogs.conceptsNotes() : [];
        return list.find(c => c.codigo === concepto)?.nombre || concepto;
    }

    onDownloadPDF(): void {
        const n = this.nota();
        if (!n) return;
        this.handleDownloadBlob(
            this.notasService.downloadPDF(n.id),
            `${n.prefijo}${n.numero}.pdf`,
            'Preparando descarga de PDF...',
            'PDF descargado con éxito',
            'Error al descargar PDF'
        );
    }

    onDownloadXML(): void {
        const n = this.nota();
        if (!n) return;
        this.handleDownloadBlob(
            this.notasService.downloadXML(n.id),
            `${n.prefijo}${n.numero}.xml`,
            'Preparando descarga de XML...',
            'XML descargado con éxito',
            'Error al descargar XML'
        );
    }

    private handleDownloadBlob(
        observable: Observable<Blob>,
        filename: string,
        loadingMessage: string,
        successMessage: string,
        errorTitle: string
    ): void {
        this.loaderService.show(loadingMessage);
        observable.subscribe({
            next: async (blob) => {
                if (blob.type === 'application/json') {
                    try {
                        const text = await blob.text();
                        const json = JSON.parse(text);
                        this.loaderService.hide();
                        const message = Array.isArray(json.message)
                            ? json.message.join(', ')
                            : json.message;
                        this.notificationService.error(
                            message || 'Error al descargar el archivo',
                            errorTitle
                        );
                        return;
                    } catch {
                        // Continuar si falla el parseo
                    }
                }
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                window.URL.revokeObjectURL(url);
                this.loaderService.hide();
                this.notificationService.success(successMessage, 'Éxito');
            },
            error: async (err) => {
                this.loaderService.hide();
                let message = 'Error al descargar el archivo';
                if (err?.error instanceof Blob) {
                    try {
                        const text = await err.error.text();
                        const json = JSON.parse(text);
                        message = Array.isArray(json.message)
                            ? json.message.join(', ')
                            : json.message || message;
                    } catch {
                        // fall through
                    }
                } else if (err?.message) {
                    message = err.message;
                }
                this.notificationService.error(message, errorTitle);
            }
        });
    }
}

