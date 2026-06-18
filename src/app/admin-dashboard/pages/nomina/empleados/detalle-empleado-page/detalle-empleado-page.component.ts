import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NominaService } from '../../services/nomina.service';
import { Empleado } from '../../interfaces/nomina.interface';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-detalle-empleado-page',
    standalone: true,
    imports: [CommonModule, RouterLink, DatePipe],
    templateUrl: './detalle-empleado-page.component.html',
})
export default class DetalleEmpleadoPageComponent {
    private route = inject(ActivatedRoute);
    private nominaService = inject(NominaService);

    empleado = signal<Empleado | null>(null);
    loading = signal(true);
    error = signal<string | null>(null);

    nombreCompleto = computed(() => {
        const e = this.empleado();
        if (!e) return '';
        return [e.primerNombre, e.segundoNombre, e.primerApellido, e.segundoApellido]
            .filter(Boolean).join(' ');
    });

    tipoDocumentoLabel = computed(() => {
        const map: Record<string, string> = {
            CC: 'Cédula de Ciudadanía',
            CE: 'Cédula de Extranjería',
            NIT: 'NIT',
            TI: 'Tarjeta de Identidad',
            PP: 'Pasaporte',
        };
        return map[this.empleado()?.tipoDocumento || ''] || this.empleado()?.tipoDocumento || '';
    });

    tipoContratoLabel = computed(() => {
        const map: Record<string, string> = {
            FIJO: 'Término Fijo',
            INDEFINIDO: 'Término Indefinido',
            OBRA_LABOR: 'Obra / Labor',
            APRENDIZAJE: 'Aprendizaje',
            PRESTACION: 'Prestación de Servicios',
        };
        return map[this.empleado()?.tipoContrato || ''] || '';
    });

    arlLabel = computed(() => {
        const nivel = this.empleado()?.arlNivelRiesgo;
        const map: Record<string, string> = {
            '1': 'I - Mínimo',
            '2': 'II - Bajo',
            '3': 'III - Medio',
            '4': 'IV - Alto',
            '5': 'V - Máximo',
        };
        return map[String(nivel)] || '';
    });

    constructor() {
        this.loadEmpleado();
    }

    async loadEmpleado() {
        const id = this.route.snapshot.params['id'];
        if (!id) {
            this.error.set('ID de empleado no proporcionado');
            this.loading.set(false);
            return;
        }
        try {
            const emp = await firstValueFrom(this.nominaService.getEmpleado(id));
            this.empleado.set(emp);
        } catch (err: any) {
            this.error.set(err?.message || 'Error al cargar empleado');
        } finally {
            this.loading.set(false);
        }
    }
}
