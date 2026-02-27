import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header-title-compras',
  imports: [RouterLink],
  template: `
    <div class="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <h2 class="text-title-md2 font-bold text-black dark:text-white">
        Facturas de Compra
      </h2>

      <nav>
        <ol class="flex items-center gap-2">
          <li>
            <a class="font-medium" >Compras /</a>
          </li>
          <li class="font-medium text-primary">Facturas de Compra</li>
        </ol>
      </nav>
    </div>

    <div class="mb-6 flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Gestión de Facturas de Compra
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Administra tus comprobantes de compra y gastos  
        </p>
      </div>

      <a
        routerLink="/panel/compras/purchases/new-Item"
        class="inline-flex items-center rounded-lg bg-blue-700 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
      >
        <svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
        </svg>
        Nueva Factura de Compra
      </a>
    </div>
  `,
  standalone: true
})
export class HeaderTitleComprasComponent { }
