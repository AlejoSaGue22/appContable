import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { initFlowbite } from 'flowbite';
import { NotificationContainer } from "@shared/components/notification-container/notification-container.component";
import { CatalogsStore } from '@dashboard/services/catalogs.store';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationContainer],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
    title = 'contableSoft';
    private catalogsStore = inject(CatalogsStore);

}
