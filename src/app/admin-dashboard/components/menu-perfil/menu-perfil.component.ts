import { TitleCasePipe } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HelpersUtils } from '@utils/helpers.utils';

@Component({
 selector: 'app-menu-perfil',
 imports: [RouterLink, TitleCasePipe],
 templateUrl: './menu-perfil.component.html',
})
export class MenuPerfilComponent { 
 logoApp = HelpersUtils.logoApp;
 nameApp = HelpersUtils.nameApp;
 sloganApp = HelpersUtils.slogan;
}
