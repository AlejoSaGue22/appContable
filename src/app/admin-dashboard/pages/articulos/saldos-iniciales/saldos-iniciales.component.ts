import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { LoaderComponent } from 'src/app/utils/components/loader/loader.component';
import { NotificationService } from '@shared/services/notification.service';
import { ProductosService } from '@dashboard/pages/ventas/services/productos.service';
import { InventarioService } from '@dashboard/services/inventario.service';

interface FilaSaldo {
    id: string;
    codigo: string;
    nombre: string;
    stockActual: number;
    deseado: number | null;
    resultado?: string;
}

/**
 * Carga inicial de inventario: fija el stock deseado por artículo
 * (solo inventariables). El backend omite los que ya tienen kardex.
 */
@Component({
    selector: 'app-saldos-iniciales',
    standalone: true,
    imports: [CommonModule, RouterLink, HeaderTitlePageComponent, LoaderComponent],
    templateUrl: './saldos-iniciales.component.html',
})
export class SaldosInicialesComponent {
    headTitle: HeaderInput = {
        title: 'Carga inicial de inventario',
        slog: 'Fije el stock actual de sus productos inventariables'
    };

    private productosService = inject(ProductosService);
    private inventarioService = inject(InventarioService);
    private notificationService = inject(NotificationService);

    filas = signal<FilaSaldo[]>([]);
    cargando = signal(false);
    procesando = signal(false);
    importando = signal(false);
    totalRegistros = signal(0);
    searchTerm = signal('');
    soloPendientes = signal(true);
    /** Códigos del archivo sin coincidencia o con cantidad inválida. */
    noEncontrados = signal<Array<{ codigo: string; motivo: string }>>([]);

    visibles = computed(() => {
        const q = this.searchTerm().trim().toLowerCase();
        return this.filas().filter(f => {
            if (this.soloPendientes() && f.stockActual !== 0) return false;
            if (!q) return true;
            return f.nombre.toLowerCase().includes(q) || f.codigo.toLowerCase().includes(q);
        });
    });

    aProcesar = computed(() =>
        this.filas().filter(f => f.deseado !== null && f.deseado >= 0 && f.deseado !== f.stockActual)
    );

    constructor() {
        this.cargar();
    }

    async cargar() {
        this.cargando.set(true);
        try {
            const res = await firstValueFrom(
                this.productosService.getProductos({ offset: 0, limit: 500, search: '' })
            );
            this.totalRegistros.set(res.count);
            this.filas.set(
                (res.articulos || [])
                    .filter(a => a.isInventariable !== false)
                    .map(a => ({
                        id: a.id,
                        codigo: a.codigo,
                        nombre: a.nombre,
                        stockActual: Number(a.stock ?? 0),
                        deseado: null as number | null,
                    }))
            );
        } catch {
            this.notificationService.error('No se pudieron cargar los artículos', 'Error', 5000);
        } finally {
            this.cargando.set(false);
        }
    }

    setDeseado(id: string, value: any) {
        const n = value === '' || value === null ? null : Number(value);
        this.filas.update(list =>
            list.map(f => (f.id === id ? { ...f, deseado: n, resultado: undefined } : f))
        );
    }

    // ========== IMPORTAR CSV / EXCEL ==========
    // Formato: columna código (codigo/código/sku/referencia) + columna
    // cantidad (cantidad/stock/saldo/existencia). Primera fila = encabezados.

    async onArchivoSeleccionado(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        input.value = '';
        if (!file) return;
        this.importando.set(true);
        try {
            const filasArchivo = await this.leerArchivo(file);
            this.aplicarImportacion(filasArchivo);
        } catch {
            this.notificationService.error('No se pudo leer el archivo. Verifique el formato.', 'Error', 5000);
        } finally {
            this.importando.set(false);
        }
    }

    private leerArchivo(file: File): Promise<Array<Record<string, any>>> {
        const esCsv = /\.csv$/i.test(file.name);
        if (esCsv) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        resolve(this.parseCsv(String(reader.result || '')));
                    } catch (e) {
                        reject(e);
                    }
                };
                reader.onerror = () => reject(reader.error);
                reader.readAsText(file, 'UTF-8');
            });
        }
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                try {
                    const wb = XLSX.read(reader.result, { type: 'array' });
                    const ws = wb.Sheets[wb.SheetNames[0]];
                    const matrix = XLSX.utils.sheet_to_json<Array<any>>(ws, { header: 1, defval: '' });
                    resolve(this.matrizAObjetos(matrix));
                } catch (e) {
                    reject(e);
                }
            };
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
        });
    }

    private parseCsv(texto: string): Array<Record<string, any>> {
        const lineas = texto.split(/\r?\n/).filter(l => l.trim() !== '');
        if (lineas.length < 2) throw new Error('CSV vacío');
        const sampler: string = lineas[0];
        const delim = (sampler.match(/;/g) || []).length > (sampler.match(/,/g) || []).length ? ';' : ',';
        const celdas = (l: string) => l.split(delim).map(c => c.trim().replace(/^"|"$/g, ''));
        const headers = celdas(lineas[0]);
        return lineas.slice(1).map(l => {
            const vals = celdas(l);
            const obj: Record<string, any> = {};
            headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
            return obj;
        });
    }

    private matrizAObjetos(matrix: Array<Array<any>>): Array<Record<string, any>> {
        if (matrix.length < 2) throw new Error('Hoja vacía');
        const headers = matrix[0].map(h => String(h ?? ''));
        return matrix.slice(1)
            .filter(row => row.some(v => String(v ?? '').trim() !== ''))
            .map(row => {
                const obj: Record<string, any> = {};
                headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
                return obj;
            });
    }

    private aplicarImportacion(filasArchivo: Array<Record<string, any>>) {
        const norm = (s: any) =>
            String(s ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
        const aliasCodigo = ['codigo', 'code', 'sku', 'referencia', 'ref'];
        const aliasCantidad = ['cantidad', 'stock', 'saldo', 'saldo_inicial', 'saldoinicial', 'qty', 'existencia', 'existencias'];

        const porCodigo = new Map(this.filas().map(f => [norm(f.codigo), f]));
        const noEncontrados: Array<{ codigo: string; motivo: string }> = [];
        let aplicadas = 0;

        for (const row of filasArchivo) {
            const keys = Object.keys(row);
            const kCod = keys.find(k => aliasCodigo.includes(norm(k)));
            const kCant = keys.find(k => aliasCantidad.includes(norm(k)));
            const codigoRaw = kCod ? String(row[kCod]).trim() : '';
            if (!codigoRaw) continue;
            const fila = porCodigo.get(norm(codigoRaw));
            if (!fila) {
                noEncontrados.push({ codigo: codigoRaw, motivo: 'código no existe' });
                continue;
            }
            const cant = kCant ? Number(String(row[kCant]).replace(',', '.')) : NaN;
            if (!Number.isFinite(cant) || cant < 0) {
                noEncontrados.push({ codigo: codigoRaw, motivo: 'cantidad inválida' });
                continue;
            }
            aplicadas++;
            porCodigo.set(norm(codigoRaw), { ...fila, deseado: cant, resultado: undefined });
        }

        this.filas.set([...porCodigo.values()]);
        this.noEncontrados.set(noEncontrados);

        if (!aplicadas && !noEncontrados.length) {
            this.notificationService.error('El archivo no tiene filas válidas (se requieren columnas de código y cantidad).', 'Error', 5000);
            return;
        }
        this.notificationService.success(
            `Importación: ${aplicadas} saldos aplicados` +
            (noEncontrados.length ? `, ${noEncontrados.length} filas con problema (revise el listado).` : '. Revise y pulse "Cargar saldos".'),
            'Inventario',
            6000
        );
    }

    async procesar() {
        const items = this.aProcesar().map(f => ({ articuloId: f.id, cantidad: f.deseado as number }));
        if (!items.length) {
            this.notificationService.error('Digite al menos un saldo deseado distinto del actual.', 'Validación', 5000);
            return;
        }
        this.procesando.set(true);
        try {
            const res = await firstValueFrom(this.inventarioService.saldosIniciales(items));
            if (!res.success) {
                const msg = Array.isArray(res.message) ? res.message.join(' ') : (res.message || 'Error al procesar');
                this.notificationService.error(msg, 'Error', 5000);
                return;
            }
            const resultados: Array<{ articuloId: string; nuevo: number; estado: string }> =
                (res.data as any)?.data ?? [];
            const porId = new Map(resultados.map(r => [r.articuloId, r]));
            let ok = 0;
            this.filas.update(list =>
                list.map(f => {
                    const r = porId.get(f.id);
                    if (!r) return f;
                    if (r.estado === 'cargado') ok++;
                    return { ...f, stockActual: Number(r.nuevo ?? f.stockActual), deseado: null, resultado: r.estado };
                })
            );
            this.notificationService.success(
                `Saldos cargados: ${ok} de ${resultados.length}. Los omitidos ya tenían kardex.`,
                'Inventario',
                5000
            );
        } finally {
            this.procesando.set(false);
        }
    }
}
