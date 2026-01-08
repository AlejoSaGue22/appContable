import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-header-title-invoices',
  imports: [RouterLink],
  templateUrl: './header-title-invoices.component.html',
})
export class HeaderTitleInvoices {

  canCreate = input<boolean>(true);
 }
