import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
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
  user = this.authService.user();

  activeMenu: string | null = 'Dashboard';

  async cerrarSesion() {
    this.authService.logout()
    await this.router.navigateByUrl("/")
  }

  constructor() {
    console.log(this.user);
  }

  toggleActiveMenu(menuId: string) {
    if (this.activeMenu === menuId) {
      this.activeMenu = null;
    } else {
      this.activeMenu = menuId;
    }
  }

}
