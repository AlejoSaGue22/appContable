import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { initFlowbite } from 'flowbite';
import { NotificationContainer } from "@shared/components/notification-container/notification-container.component";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NotificationContainer],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
    title = 'contableSoft';

    // ngOnInit(): void {
    //     initFlowbite();
    // }

    //  flowbiteService = inject(FlowbiteService);

}
