import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Empleado } from '../../../interfaces/nomina.interface';

@Component({
 selector: 'app-empleado-table',
 standalone: true,
 imports: [CommonModule],
 template: `
 <div class="overflow-x-auto rounded-xl border border-slate-200">
 <table class="w-full text-sm">
 <thead class="bg-slate-50 text-slate-600 text-xs font-bold uppercase ">
 <tr>
 <th class="px-4 py-3 text-left">Documento</th>
 <th class="px-4 py-3 text-left">Nombre</th>
 <th class="px-4 py-3 text-left">Cargo</th>
 <th class="px-4 py-3 text-left">Salario Base</th>
 <th class="px-4 py-3 text-left">EPS</th>
 <th class="px-4 py-3 text-left">Estado</th>
 <th class="px-4 py-3 text-right">Acciones</th>
 </tr>
 </thead>
 <tbody class="divide-y divide-slate-100">
 @for (emp of empleados(); track emp.id) {
 <tr class="hover:bg-slate-50 transition-colors">
 <td class="px-4 py-3 font-mono text-xs">{{ emp.tipoDocumento }} {{ emp.numeroDocumento }}</td>
 <td class="px-4 py-3 font-medium">{{ emp.primerNombre }} {{ emp.primerApellido }}</td>
 <td class="px-4 py-3 text-slate-600">{{ emp.cargo?.nombre || '-' }}</td>
 <td class="px-4 py-3 font-mono">\$ {{ emp.salarioBase | number:'1.0-0' }}</td>
 <td class="px-4 py-3 text-xs">{{ emp.eps?.nombre || '-' }}</td>
 <td class="px-4 py-3">
 <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
 [class.bg-green-100]="emp.activo"
 [class.text-green-700]="emp.activo"
 [class.bg-red-100]="!emp.activo"
 [class.text-red-700]="!emp.activo">
 {{ emp.activo ? 'Activo' : 'Inactivo' }}
 </span>
 </td>
 <td class="px-4 py-3 text-right">
 <button (click)="edit.emit(emp)" class="text-blue-600 hover:text-blue-800 text-xs font-bold mr-3">Editar</button>
 <button (click)="delete.emit(emp.id)" class="text-red-600 hover:text-red-800 text-xs font-bold">Eliminar</button>
 </td>
 </tr>
 } @empty {
 <tr>
 <td colspan="7" class="px-4 py-8 text-center text-slate-400 text-sm">
 No hay empleados registrados
 </td>
 </tr>
 }
 </tbody>
 </table>
 </div>
 `
})
export class EmpleadoTableComponent {
 empleados = input<Empleado[]>([]);
 edit = output<Empleado>();
 delete = output<string>();
}
