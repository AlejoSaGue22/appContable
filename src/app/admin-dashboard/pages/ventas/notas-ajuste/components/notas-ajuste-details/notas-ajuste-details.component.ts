import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NotaAjuste, NotaAjusteStatus } from '@dashboard/interfaces/notas-ajuste-interface';
import { NotasAjusteService } from '@dashboard/pages/ventas/services/notas-ajuste.service';
import { AsientosHttpService } from '@dashboard/services/asientos-http.service';
import { NotificationService } from '@shared/services/notification.service';
import { PrintService } from '@shared/services/print.service';
import { DianStatus } from '@dashboard/interfaces/documento-venta-interface';
import { CatalogsStore } from '@dashboard/services/catalogs.store';

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
        // Usamos el número completo (prefijo + numero) para buscar los asientos
        console.log("Nota: ", n);
        const referencia = `${n.prefijo}-${n.numero}`;

        this.asientosService.getByReferencia(n.numeroCompleto || '').subscribe({
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
            [NotaAjusteStatus.SENT]: 'Enviada',
            [NotaAjusteStatus.ACCEPTED]: 'Aceptada',
            [NotaAjusteStatus.REJECTED]: 'Rechazada',
            [NotaAjusteStatus.CANCELLED]: 'Anulada',
            [NotaAjusteStatus.ERROR_ASIENTO]: 'Error Asiento',
        };
        return labels[status] || status;
    }

    getDianStatusClass(status: DianStatus): string {
        const classes: Record<DianStatus, string> = {
            [DianStatus.PENDING]: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            [DianStatus.SENT]: 'bg-blue-50 text-blue-700 border-blue-200',
            [DianStatus.PROCESSING]: 'bg-blue-100 text-blue-800 border-blue-300 animate-pulse',
            [DianStatus.ACCEPTED]: 'bg-green-100 text-green-800 border-green-300',
            [DianStatus.REJECTED]: 'bg-red-100 text-red-800 border-red-300',
            [DianStatus.CANCELLED]: 'bg-gray-100 text-gray-800 border-gray-300'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    getDianStatusLabel(status: DianStatus): string {
        const labels: Record<DianStatus, string> = {
            [DianStatus.PENDING]: 'Pendiente envío',
            [DianStatus.SENT]: 'Enviada',
            [DianStatus.PROCESSING]: 'Procesando',
            [DianStatus.ACCEPTED]: 'Aceptada por DIAN',
            [DianStatus.REJECTED]: 'Rechazada por DIAN',
            [DianStatus.CANCELLED]: 'Anulada'
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
        this.notasService.downloadPDF(n.id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${n.prefijo}${n.numero}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
            },
            error: (err) => this.notificationService.error('Error al descargar PDF', err.message)
        });
    }

    onDownloadXML(): void {
        const n = this.nota();
        if (!n) return;
        this.notasService.downloadXML(n.id).subscribe({
            next: (blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${n.prefijo}${n.numero}.xml`;
                a.click();
                window.URL.revokeObjectURL(url);
            },
            error: (err) => this.notificationService.error('Error al descargar XML', err.message)
        });
    }
}

