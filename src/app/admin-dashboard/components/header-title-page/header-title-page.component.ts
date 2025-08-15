import { Component, input } from '@angular/core';

export interface HeaderInput {
    title: string;
    slog: string;
}

@Component({
  selector: 'header-title-page',
  imports: [],
  templateUrl: './header-title-page.component.html',
})
export class HeaderTitlePageComponent {

    titleHead = input.required<HeaderInput>()
 }
