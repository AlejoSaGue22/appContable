import { Component } from '@angular/core';
import { HeaderInput, HeaderTitlePageComponent } from "../../components/header-title-page/header-title-page.component";

@Component({
  selector: 'app-dashboarg-page',
  imports: [HeaderTitlePageComponent],
  templateUrl: './dashboarg-page.component.html',
})
export class DashboargPageComponent {
    headTitle: HeaderInput = {
          title: 'Dashboard',
          slog: 'Resumen general de tu empresa'
    }
 }
