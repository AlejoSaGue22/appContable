import { Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { InventarioService, StockArticulo } from '@dashboard/services/inventario.service';
import { NotificationService } from '@shared/services/notification.service';

/**
 * Kardex por artículo: stock actual + últimos movimientos + ajuste manual
 * (carga inicial / conteo). La cantidad + entra, − sale.
 */
@Component({
    selector: 'app-kardex-modal',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './kardex-modal.component.html',
})
export class KardexModalComponent {
    articuloId = input<string>('');
    articuloNombre = input<string>('');

    ajustado = output<void>();

    private inventario = inject(InventarioService);
    private notificationService = inject(NotificationService);
    private fb = inject(FormBuilder);

    stock = signal<StockArticulo | null>(null);
    cargando = signal(false);
    guardando = signal(false);

    form = this.fb.group({
        cantidad: [0, [Validators.required, Validators.pattern(/^-?\d+(\.\d{1,2})?$/)]],
        motivo: ['Saldo inicial'],
    });

    constructor() {
        effect(() => {
            const id = this.articuloId();
            if (id) this.cargar(id);
            else this.stock.set(null);
        });
    }

    private mensajeError(res: { message?: string | string[] }, defecto: string): string {
        if (Array.isArray(res.message)) return res.message.join(' ') || defecto;
        return res.message || defecto;
    }

    async cargar(id: string) {
        this.cargando.set(true);
        try {
            const res = await firstValueFrom(this.inventario.getStock(id));
            if (res.success) this.stock.set(res.data as StockArticulo);
            else this.notificationService.error(this.mensajeError(res, 'No se pudo cargar el kardex'), 'Error', 5000);
        } catch {
            this.notificationService.error('No se pudo cargar el kardex', 'Error', 5000);
        } finally {
            this.cargando.set(false);
        }
    }

    async guardarAjuste() {
        const cantidad = Number(this.form.value.cantidad) || 0;
        if (cantidad === 0) {
            this.notificationService.error('La cantidad del ajuste debe ser distinta de 0.', 'Validación', 5000);
            return;
        }
        const id = this.articuloId();
        if (!id) return;
        this.guardando.set(true);
        try {
            const res = await firstValueFrom(
                this.inventario.ajuste(id, cantidad, this.form.value.motivo || 'Ajuste manual')
            );
            if (!res.success) {
                this.notificationService.error(this.mensajeError(res, 'No se pudo registrar el ajuste'), 'Error', 5000);
                return;
            }
            this.notificationService.success('Ajuste registrado', 'Inventario', 3000);
            this.form.patchValue({ cantidad: 0 });
            await this.cargar(id);
            this.ajustado.emit();
        } finally {
            this.guardando.set(false);
        }
    }
}
