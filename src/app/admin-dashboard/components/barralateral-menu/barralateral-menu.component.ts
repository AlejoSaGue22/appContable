import { NgClass } from '@angular/common';
import { Component, inject, input, linkedSignal, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuOption } from '@dashboard/layouts/admin-layouts/admin-layouts.component';

@Component({
  selector: 'app-barralateral-menu',
  imports: [RouterLink, NgClass, RouterLinkActive],
  templateUrl: './barralateral-menu.component.html',
})
export class BarralateralMenuComponent {


    title =  input.required<string>();
    IconSVG = input();
    subItems = input.required<MenuOption[]>();
    defaultOpen = input<boolean>(false);
    activeMenu = input<string | null>(null);
    menuId = input<string>();
    menuToggled = output<string>();
    

    get isOpen(): boolean {
      return this.activeMenu() === this.menuId();
    }

    toggleMenu(){
        this.menuToggled.emit(this.menuId()!)
    } 

}
