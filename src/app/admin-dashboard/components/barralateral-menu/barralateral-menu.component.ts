import { NgClass } from '@angular/common';
import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MenuOption } from '@dashboard/layouts/admin-layouts/admin-layouts.component';
import { MenuItem } from '@utils/menu.config';

@Component({
  selector: 'app-barralateral-menu',
  imports: [RouterLink, NgClass, RouterLinkActive],
  templateUrl: './barralateral-menu.component.html',
})
export class BarralateralMenuComponent {

    title =  input.required<string>();
    menuSection = input<MenuItem>();
    subItems = input.required<MenuItem[]>();
    defaultOpen = input<boolean>(false);
    activeMenu = input<string | null>(null);
    menuId = input<string>();
    menuToggled = output<string>();

    children = computed(() => {
      return this.menuSection()?.children ?? [];
    });

    get isOpen(): boolean {
      return this.activeMenu() === this.menuId();
    }

    toggleMenu(){
        this.menuToggled.emit(this.menuId()!)
    } 

    

}
