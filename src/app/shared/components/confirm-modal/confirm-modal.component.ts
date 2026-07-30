import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ConfirmModalConfig = {
  title: string;
  message: string;
  detail?: string;
  confirmLabel?: string;
  confirmClass?: string;
  icon?: 'warning' | 'danger' | 'info' | 'success';
};

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-modal.component.html',
})
export class ConfirmModalComponent {
  config = input.required<ConfirmModalConfig>();
  confirmed = output<void>();
  cancelled = output<void>();
}
