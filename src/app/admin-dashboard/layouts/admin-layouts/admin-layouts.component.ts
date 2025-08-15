import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MenuPerfilComponent } from "../../components/menu-perfil/menu-perfil.component";

interface MenuOption {
  name: string
  route: string
  icon: string
}

@Component({
  selector: 'app-admin-layouts',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MenuPerfilComponent],
  templateUrl: './admin-layouts.component.html',
})
export default class AdminLayoutsComponent {

    menuItems: MenuOption[] = [
      {
        name: 'Dashboard',
        route: '/dashboard/index',
        icon: 'fa-solid fa-layer-group'
      },
      {
        name: 'Clientes',
        route: '/dashboard/clients',
        icon: 'fa-solid fa-users'
      },
      {
        name: 'Ingresos',
        route: '/dashboard/income',
        icon: 'fa-solid fa-dollar-sign'
      },
      {
        name: 'Gastos',
        route: '/dashboard/gastos',
        icon: 'fa-solid fa-circle-dollar-to-slot'
      },
      {
        name: 'Colaboradores',
        route: '/dashboard/colaborators',
        icon: 'fa-solid fa-landmark'
      }
    ]

 }
