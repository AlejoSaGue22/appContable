import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderInput, HeaderTitlePageComponent } from '@dashboard/components/header-title-page/header-title-page.component';
import { BreadcrumbComponent } from '@shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-empresa',
  standalone: true,
  imports: [CommonModule, HeaderTitlePageComponent, BreadcrumbComponent],
  templateUrl: './empresa.component.html',
})
export class EmpresaComponent {
  headTitle = signal<HeaderInput>({
    title: 'Empresa',
    slog: 'Configura la información general de tu empresa',
  });

  breadcrumbItems = [
    { label: 'Configuración', route: '/panel/admin/settings' },
    { label: 'Empresa' },
  ];
}
