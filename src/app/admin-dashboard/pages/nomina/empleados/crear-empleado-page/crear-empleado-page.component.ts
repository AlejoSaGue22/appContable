import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NominaService } from '../../services/nomina.service';
import { Empleado } from '../../interfaces/nomina.interface';
import { EmpleadoFormComponent } from '../components/reusable/empleado-form.component';
import { HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { LoaderService } from '@utils/services/loader.service';

@Component({
    selector: 'app-crear-empleado-page',
    standalone: true,
    imports: [CommonModule, RouterLink, EmpleadoFormComponent, HeaderTitlePageComponent],
    templateUrl: './crear-empleado-page.component.html',
})
export default class CrearEmpleadoPageComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private nominaService = inject(NominaService);
    private loader = inject(LoaderService);

    isEditing = signal(false);
    empleado = signal<Empleado | null>(null);
    loading = signal(false);

    get title() {
        return this.isEditing() ? 'Editar Empleado' : 'Nuevo Empleado';
    }

    get slog() {
        return this.isEditing() ? 'Actualiza los datos del empleado registrado' : 'Registra un nuevo empleado en el sistema';
    }

    ngOnInit() {
        const id = this.route.snapshot.params['id'];
        if (id) {
            this.isEditing.set(true);
            this.loading.set(true);
            this.loader.show();
            this.nominaService.getEmpleado(id).subscribe({
                next: (emp) => {
                    this.empleado.set(emp);
                    this.loading.set(false);
                    this.loader.hide();
                },
                error: () => {
                    this.loading.set(false);
                    this.loader.hide();
                }
            });
        }
    }

    onSaved(emp: Empleado) {
        this.router.navigate(['/panel/nomina/empleados', emp.id, 'details']);
    }

    onCancelled() {
        this.router.navigate(['/panel/nomina/empleados']);
    }
}
