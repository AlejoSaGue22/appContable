import { ChangeDetectionStrategy, Component, inject, input, output } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from '@utils/menu.config';
import { AuthService } from 'src/app/auth/services/auth.service';
import { BarralateralMenuComponent } from "../barralateral-menu/barralateral-menu.component";

@Component({
  selector: 'app-option-barralateral',
  imports: [BarralateralMenuComponent],
  templateUrl: './option-barralateral.component.html',
})
export class OptionBarralateral {

  authService = inject(AuthService);
  router = inject(Router);

  menuItemsOther = input<MenuItem[]>();
  activeMenu = input<string | null>(null);
  activeRoute = input<string>('');
  menuToggled = output<string>();
  user = this.authService.user;

  async cerrarSesion() {
    this.authService.logout()
    await this.router.navigateByUrl("/")
  }

  isItemActive(item: MenuItem): boolean {
    if (item.children) {
      return item.children.some(child =>
        this.activeRoute() === child.route ||
        this.activeRoute().startsWith(child.route + '/')
      );
    }
    return this.activeRoute() === item.route;
  }

  toggleActiveMenu(menuId: string) {
    this.menuToggled.emit(menuId);
  }

}
