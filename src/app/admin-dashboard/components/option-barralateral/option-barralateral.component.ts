import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/auth/services/auth.service';

@Component({
  selector: 'app-option-barralateral',
  imports: [],
  templateUrl: './option-barralateral.component.html',
})
export class OptionBarralateral {

  authService = inject(AuthService);
  router = inject(Router);

  async cerrarSesion(){
      this.authService.logout()
      await this.router.navigateByUrl("/")
  }
 }
