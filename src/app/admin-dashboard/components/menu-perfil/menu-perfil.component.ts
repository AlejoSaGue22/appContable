import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HelpersUtils } from '@utils/helpers.utils';

@Component({
  selector: 'app-menu-perfil',
  imports: [RouterLink],
  templateUrl: './menu-perfil.component.html',
})
export class MenuPerfilComponent { 
  logoApp = HelpersUtils.logoApp;
  nameApp = HelpersUtils.nameApp;
}
