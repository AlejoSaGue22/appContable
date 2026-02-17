import { Component, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header-title-proveedores',
  imports: [RouterLink],
  template: `
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-title-md2 font-bold text-black dark:text-white">
        Proveedores
      </h2>

      <nav>
        <ol class="flex items-center gap-2">
          <li>
            <a class="font-medium" routerLink="/panel/dashboard">Dashboard /</a>
          </li>
          <li class="font-medium text-primary">Proveedores</li>
        </ol>
      </nav>
    </div>

    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
          Gestión de Proveedores
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Administra la información de tus proveedores
        </p>
      </div>

      <div class="flex items-center space-x-3">
        <div class="relative">
                  <input class="bg-white w-full pr-11 h-10 pl-3 py-2 placeholder:text-slate-400 text-slate-700 
                  text-sm border border-slate-200 rounded transition duration-200 ease focus:outline-none focus:border-slate-400
                  hover:border-slate-400 shadow-sm focus:shadow-md dark:bg-gray-700 dark:text-white dark:border-gray-600"
                      placeholder="Buscar usuarios..." type="text" #txtSearch (input)="onSearch($event)" />
                  <button
                      class="absolute h-8 w-8 right-1 top-1 my-auto px-2 flex items-center bg-white dark:bg-gray-700 rounded"
                      type="button">
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="3"
                          stroke="currentColor" class="w-8 h-8 text-slate-600 dark:text-gray-400">
                          <path stroke-linecap="round" stroke-linejoin="round"
                              d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                      </svg>
                  </button>
        </div>
        <a
          routerLink="/panel/compras/proveedores/new-Item"
          class="inline-flex items-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
        >
          <svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
          </svg>
          Nuevo Proveedor
        </a>
      </div>
    </div>
  `,
  standalone: true
})
export class HeaderTitleProveedoresComponent {
  searchTerm = output<string>();

  onSearch(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchTerm.emit(target.value);
  }
}
