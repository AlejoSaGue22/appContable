import { Component, computed, input, output, signal, effect, inject } from '@angular/core';
import { RouterLink } from "@angular/router";
import { FormsModule } from '@angular/forms';
import { PaginationComponent } from '@shared/components/pagination/pagination';
import { NotaAjusteSoporte, NotaAjusteSoporteStatus } from '../../../../../interfaces/notas-ajuste-soporte-interface';
import { CurrencyPipe } from '@angular/common';

export interface NotaSoporteFilters {
    tipo?: string;
    estado?: string;
    documentoNumero?: string;
    proveedorNombre?: string;
}

@Component({
    selector: 'app-table-notas-soporte',
    standalone: true,
    imports: [RouterLink, FormsModule, PaginationComponent, CurrencyPipe],
    templateUrl: './table-notas-soporte.component.html',
})
export class TableNotasSoporteComponent {

    notas = input.required<NotaAjusteSoporte[]>();
    activeFilters = input<NotaSoporteFilters>({});

    // Output events
    filterChange = output<NotaSoporteFilters>();
    pageChange = output<number>();
    registrarBorrador = output<string>();
    anular = output<string>();
    delete = output<string>();
    reintentarAsiento = output<string>();

    // Filter signals
    proveedorNombre = signal<string>('');
    estado = signal<string>('');
    tipo = signal<string>('');
    documentoNumero = signal<string>('');

    activeFiltersCount = computed(() => {
        let count = 0;
        if (this.proveedorNombre()) count++;
        if (this.estado()) count++;
        if (this.tipo()) count++;
        if (this.documentoNumero()) count++;
        return count;
    });

    showFilters = signal<boolean>(false);

    constructor() {
        effect(() => {
            const filters = this.activeFilters();
            this.proveedorNombre.set(filters.proveedorNombre ?? '');
            this.estado.set(filters.estado ?? '');
            this.tipo.set(filters.tipo ?? '');
            this.documentoNumero.set(filters.documentoNumero ?? '');

            if (filters.estado || filters.tipo || filters.documentoNumero) {
                this.showFilters.set(true);
            }
        }, { allowSignalWrites: true });
    }

    toggleFilters(): void {
        this.showFilters.update(v => !v);
    }

    get notaDataArray(): NotaAjusteSoporte[] {
        const data = this.notas();
        return Array.isArray(data) ? data : [data];
    }

    readonly estados = [
        { value: '', label: 'Todos los estados' },
        { value: NotaAjusteSoporteStatus.DRAFT, label: 'Borrador' },
        { value: NotaAjusteSoporteStatus.REGISTRADO, label: 'Registrada' },
        { value: NotaAjusteSoporteStatus.ANULADO, label: 'Anulada' },
        { value: NotaAjusteSoporteStatus.ERROR_ASIENTO, label: 'Error Asiento' }
    ];

    readonly tipos = [
        { value: '', label: 'Todos los tipos' },
        { value: 'CREDITO', label: 'Nota Crédito' },
        { value: 'DEBITO', label: 'Nota Débito' }
    ];

    applyFilters(): void {
        const filters: NotaSoporteFilters = {};
        if (this.proveedorNombre()) filters.proveedorNombre = this.proveedorNombre();
        if (this.estado()) filters.estado = this.estado();
        if (this.tipo()) filters.tipo = this.tipo();
        if (this.documentoNumero()) filters.documentoNumero = this.documentoNumero();
        this.filterChange.emit(filters);
    }

    clearFilters(): void {
        this.proveedorNombre.set('');
        this.estado.set('');
        this.tipo.set('');
        this.documentoNumero.set('');
        this.filterChange.emit({});
    }

    getStatusClass(status: NotaAjusteSoporteStatus): string {
        const classes: Record<NotaAjusteSoporteStatus, string> = {
            [NotaAjusteSoporteStatus.DRAFT]: 'bg-gray-100 text-gray-800',
            [NotaAjusteSoporteStatus.REGISTRADO]: 'bg-green-100 text-green-800',
            [NotaAjusteSoporteStatus.ANULADO]: 'bg-gray-500 text-white',
            [NotaAjusteSoporteStatus.ERROR_ASIENTO]: 'bg-red-600 text-white'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    }

    getStatusLabel(status: NotaAjusteSoporteStatus): string {
        const labels: Record<NotaAjusteSoporteStatus, string> = {
            [NotaAjusteSoporteStatus.DRAFT]: 'Borrador',
            [NotaAjusteSoporteStatus.REGISTRADO]: 'Registrada',
            [NotaAjusteSoporteStatus.ANULADO]: 'Anulada',
            [NotaAjusteSoporteStatus.ERROR_ASIENTO]: 'Error Asiento'
        };
        return labels[status] || status;
    }

    onRegistrarBorrador(id: string): void {
        this.registrarBorrador.emit(id);
    }

    onAnular(id: string): void {
        this.anular.emit(id);
    }

    getDianLabel(status: string | null | undefined): string {
        const labels: Record<string, string> = {
            accepted: 'DIAN ✓',
            sent: 'Enviada',
            rejected: 'Rechazada',
            pending: ''
        };
        return status ? (labels[status] ?? '') : '';
    }

    onDelete(id: string): void {
        this.delete.emit(id);
    }

    onReintentarAsiento(id: string): void {
        this.reintentarAsiento.emit(id);
    }
}
