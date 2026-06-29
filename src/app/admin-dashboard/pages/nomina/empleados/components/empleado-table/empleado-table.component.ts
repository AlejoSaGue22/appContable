import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Empleado } from '../../../interfaces/nomina.interface';

@Component({
  selector: 'app-empleado-table',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="overflow-x-auto rounded-xl border border-slate-200">
      <table class="w-full text-sm">
        <thead class="bg-slate-50 text-slate-600 text-xs font-bold uppercase">
          <tr>
            <th class="px-4 py-3 text-left">Documento</th>
            <th class="px-4 py-3 text-left">Nombre</th>
            <th class="px-4 py-3 text-left">Cargo</th>
            <th class="px-4 py-3 text-left">Salario Base</th>
            <th class="px-4 py-3 text-left">EPS</th>
            <th class="px-4 py-3 text-left">Estado</th>
            <th class="px-4 py-3 text-center">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          @for (emp of empleados(); track emp.id) {
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="px-4 py-3 font-mono text-xs">
                {{ emp.tipoDocumento }} - {{ emp.numeroDocumento }}
              </td>
              <td class="px-4 py-3">
                <a
                  [routerLink]="['/panel/nomina/empleados', emp.id, 'detalle']"
                  class="font-medium text-slate-900 hover:text-blue-600 transition-colors"
                >
                  {{ emp.primerNombre }} {{ emp.primerApellido }}
                </a>
              </td>
              <td class="px-4 py-3 text-slate-600">
                {{ emp.cargo?.nombre || '-' }}
              </td>
              <td class="px-4 py-3 font-mono">
                $ {{ emp.salarioBase | number: '1.0-0' }}
              </td>
              <td class="px-4 py-3 text-xs">{{ emp.eps.nombre || '-' }}</td>
              <td class="px-4 py-3">
                <span
                  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                  [class.bg-emerald-100]="emp.activo"
                  [class.text-emerald-700]="emp.activo"
                  [class.bg-red-100]="!emp.activo"
                  [class.text-red-600]="!emp.activo"
                >
                  {{ emp.activo ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
              <td class="text-center">
                <div class="flex items-center justify-center gap-1">
                  <a
                    [routerLink]="['/panel/nomina/empleados', emp.id, 'detalle']"
                    class="inline-flex items-center cursor-pointer rounded-lg p-2 text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-500 dark:hover:bg-gray-700"
                    title="Ver Detalle"
                  >
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
                    </svg>
                  </a>
                  <a
                    [routerLink]="['/panel/nomina/empleados', emp.id, 'editar']"
                    class="inline-flex items-center cursor-pointer rounded-lg p-2 text-sm text-blue-600 hover:bg-blue-50 dark:text-blue-500 dark:hover:bg-gray-700"
                    title="Editar"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                  </a>
                  <button
                    (click)="delete.emit(emp.id)"
                    class="inline-flex items-center cursor-pointer rounded-lg p-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-500 dark:hover:bg-gray-700"
                    title="Eliminar"
                  >
                    <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </td>
            </tr>
          } @empty {
            <tr>
              <td
                colspan="7"
                class="px-4 py-8 text-center text-slate-400 text-sm"
              >
                No hay empleados registrados
              </td>
            </tr>
          }
        </tbody>
      </table>
    </div>
  `,
})
export class EmpleadoTableComponent {
  empleados = input<Empleado[]>([]);
  delete = output<string>();
}
