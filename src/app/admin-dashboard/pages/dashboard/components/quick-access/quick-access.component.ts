import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-quick-access',
  imports: [RouterLink],
  templateUrl: './quick-access.component.html',
})
export class QuickAccess {
  accesoRapido = input.required<{ title: string; ruta: string; }[]>();
}
