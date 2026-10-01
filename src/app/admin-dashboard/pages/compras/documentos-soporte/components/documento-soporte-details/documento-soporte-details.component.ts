import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormaPago } from '@dashboard/interfaces/documento-venta-interface';
import { DocumentoSoporte } from '@dashboard/interfaces/documento-soporte-interface';
import { FacturaNotasResumen } from '@dashboard/interfaces/documento-venta-interface';
import { PagoHistorial, PaymentStatus } from '@dashboard/interfaces/pagos-interface';
import { DocumentosSoporteService } from '@dashboard/pages/compras/services/documentos-soporte.service';
import { RegistrarPagoModalData } from '@dashboard/pages/pagos/components/modal-registrarpago/modal-registrarpago.component';
import { PagosHttpService } from '@dashboard/pages/pagos/services/pagos.service';
import { AsientosHttpService } from '@dashboard/services/asientos-http.service';
import { NotificationService } from '@shared/services/notification.service';
import { PrintService } from '@shared/services/print.service';
import { HelpersUtils } from '@utils/helpers.utils';

@Component({
    selector: 'app-documento-soporte-details',
    imports: [CommonModule, RouterLink, CurrencyPipe],
    templateUrl: './documento-soporte-details.component.html',
    standalone: true
})
export class DocumentoSoporteDetailsComponent implements OnInit {
    documento = signal<DocumentoSoporte | null>(null);
    loading = signal(true);
    error = signal<string | null>(null);
    downloadingPdf = signal(false);

    // ── QR DIAN ─────────────────────────────────────────────────────
    qrDataUrl = signal<string | null>(null);
    qrRawUrl = signal<string | null>(null);

    // ── Datos contables ───────────────────────────────────────────────
    asientos: any[] = [];
    pagos: PagoHistorial[] = [];
    loadingAsientos = false;
    notasResumen = signal<FacturaNotasResumen | null>(null);

    // ── Modal de pago ─────────────────────────────────────────────────
    modalPagoVisible = false;
    modalPagoData: RegistrarPagoModalData | null = null;

    constructor(
        private documentosService: DocumentosSoporteService,
        private route: ActivatedRoute,
        private asientosService: AsientosHttpService,
        private pagosService: PagosHttpService,
        private notificationService: NotificationService,
        private printService: PrintService
    ) { }

    ngOnInit(): void {
        const id = this.route.snapshot.params['id'];
        if (id) {
            this.loadDocumento(id);
        } else {
            this.error.set('ID de documento no encontrado');
            this.loading.set(false);
        }
    }

    loadDocumento(id: string): void {
        this.loading.set(true);
        this.error.set(null);

        this.documentosService.getDocumentoSoporteById(id).subscribe((response) => {
            this.loading.set(false)
            if (!response.success) {
                this.error.set(response.error.message || 'Error al cargar el documento soporte');
                return;
            }

            this.documento.set(response.data.data[0]);
            this.resolveQr(this.documento());
            this.cargarDatosContables();
        })
    }

    private resolveQr(d: DocumentoSoporte | null): void {
        const raw = HelpersUtils.resolveQrText(d);
        this.qrRawUrl.set(raw);
        this.qrDataUrl.set(null);
        if (raw) {
            void HelpersUtils.toQrDataUrl(raw).then((dataUrl) => {
                if (HelpersUtils.resolveQrText(this.documento()) === raw) {
                    this.qrDataUrl.set(dataUrl);
                }
            });
        }
    }

    descargarPdf(): void {
        const d = this.documento();
        if (!d) return;
        this.downloadingPdf.set(true);
        this.documentosService.descargarPdf(d.id).subscribe({
            next: (blob) => {
                this.downloadingPdf.set(false);
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${d.numeroDian || d.numero || 'documento-soporte'}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
            },
            error: () => {
                this.downloadingPdf.set(false);
                this.notificationService.error('No se pudo descargar el PDF de la DIAN', 'Error');
            }
        });
    }

    // ── Carga asientos contables y pagos ──────────────────────────────
    cargarDatosContables(): void {
        const c = this.documento();
        if (!c) return;

        // Asientos generados para este documento (por referencia del número)
        this.loadingAsientos = true;
        this.asientosService.getByReferencia(c.numero || c.numeroDian || '').subscribe({
            next: a => { this.asientos = a; this.loadingAsientos = false; },
            error: () => { this.loadingAsientos = false; },
        });

        // Historial de pagos al proveedor (solo si es crédito)
        if (c.formaPago === FormaPago.CREDITO) {
            this.pagosService.getHistorialPagosDocumentoSoporte(c.id).subscribe({
                next: p => { this.pagos = p.data; },
            });
        }

        // Resumen de notas crédito/débito aplicadas (Fase 1: lectura)
        this.documentosService.getNotasResumen(c.id).subscribe({
            next: r => { this.notasResumen.set(r.data ?? null); },
            error: () => { this.notasResumen.set(null); },
        });
    }

    reintentarAsiento(): void {
        this.loading.set(true);
        this.documentosService.retryAsiento(this.documento()!.id).subscribe({
            next: () => {
                this.loadDocumento(this.documento()!.id);
                this.loading.set(false);
            },
            error: (error) => {
                this.notificationService.error(error.message || 'Ocurrio un error al reintentar asiento', 'Error');
                this.loading.set(false);
            }
        });
    }

    getPaymentStatusLabel(status: PaymentStatus | null | undefined): string {
        const map: Record<string, string> = {
            pendiente: 'Pendiente de pago',
            parcial: 'Pago parcial',
            pagado: 'Pagado',
            vencido: 'Vencido',
        };
        return status ? (map[status] ?? status) : '—';
    }

    getTipoAsientoLabel(tipo: string): string {
        const map: Record<string, string> = {
            GASTO: 'Registro de Documento Soporte',
            PAGO_PROVEEDOR: 'Pago a Proveedor',
            ANULACION_FACTURA_COMPRA: 'Anulación de Documento',
            CRUCE_ANTICIPO: 'Cruce de Anticipo',
            ANULACION_COMPROBANTE: 'Anulación Cruce de Anticipo',
            ANULACION_CRUCE_ANTICIPO: 'Anulación Cruce de Anticipo',
        };
        return map[tipo] ?? tipo;
    }

    getEstadoClass(estado: string): string {
        const map: Record<string, string> = {
            registrado: 'bg-blue-100 text-blue-800 border-blue-200',
            pagado: 'bg-green-100 text-green-800 border-green-200',
            borrador: 'bg-gray-100 text-gray-600 border-gray-200',
            anulado: 'bg-red-100 text-red-800 border-red-200',
            error_asiento: 'bg-amber-100 text-amber-800 border-amber-200',
        };
        return map[estado] ?? 'bg-gray-100 text-gray-600 border-gray-200';
    }

    getDianStatusLabel(status: string | null | undefined): string {
        const map: Record<string, string> = {
            accepted: 'Aceptada DIAN',
            sent: 'Enviada DIAN',
            rejected: 'Rechazada DIAN',
            pending: 'Sin enviar',
        };
        return status ? (map[status] ?? status) : '—';
    }

    getDianStatusClass(status: string | null | undefined): string {
        const map: Record<string, string> = {
            accepted: 'bg-green-100 text-green-800 border-green-200',
            sent: 'bg-blue-100 text-blue-800 border-blue-200',
            rejected: 'bg-red-100 text-red-800 border-red-200',
            pending: 'bg-gray-100 text-gray-600 border-gray-200',
        };
        return map[status ?? ''] ?? 'bg-gray-100 text-gray-600 border-gray-200';
    }

    print(): void {
        window.print();
    }

    printDocumentoSoporte(): void {
        const c = this.documento();
        if (c) this.printService.printPurchaseInvoice(c as any, 'Documento Soporte');
    }

    printAsiento(): void {
        const c = this.documento();
        if (c && this.asientos.length > 0) {
            const tercero = c.proveedor ? `${c.proveedor.razonSocial || c.proveedor.nombre + ' ' + c.proveedor.apellido} - ${c.proveedor.identificacion}` : '—';
            this.printService.printAsientoContable(this.asientos, c.numero || c.numeroDian || '', tercero);
        }
    }

    formatDate(date?: string | Date | null): string {
        if (!date) return '—';
        // Evitar que JS reste un día al interpretar YYYY-MM-DD como UTC
        const dateObj = typeof date === 'string' && date.includes('-') && !date.includes('T')
            ? new Date(date.replace(/-/g, '\/'))
            : new Date(date);

        return dateObj.toLocaleDateString('es-CO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}
