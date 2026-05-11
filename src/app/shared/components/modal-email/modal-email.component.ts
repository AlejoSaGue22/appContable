import { Component, EventEmitter, Input, Output, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-modal-email',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <app-modal [visible]="visible" (visibleChange)="onClose()" title="Enviar Documento por Email" width="max-w-md">
      <div class="space-y-4">
        <p class="text-sm text-gray-500">
          Ingrese el correo electrónico de destino para enviar el documento (PDF y XML).
        </p>
        
        <div class="flex flex-col gap-1.5">
          <label for="email" class="text-xs font-bold text-gray-600 uppercase tracking-wider">Correo Electrónico</label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <input 
              type="email" 
              id="email" 
              [(ngModel)]="email" 
              name="email"
              placeholder="cliente@ejemplo.com"
              class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              required
            >
          </div>
        </div>

        <div class="flex justify-end gap-2 pt-2">
          <button 
            type="button" 
            (click)="onClose()"
            class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button 
            type="button" 
            (click)="onSend()"
            [disabled]="loading || !isValidEmail()"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            @if (loading) {
              <svg class="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Enviando...
            } @else {
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Enviar Email
            }
          </button>
        </div>
      </div>
    </app-modal>
  `,
  styles: []
})
export class ModalEmailComponent implements OnChanges {
  @Input() visible = false;
  @Input() loading = false;
  @Input() initialEmail = '';
  @Output() visibleChange = new EventEmitter<boolean>();
  @Output() send = new EventEmitter<string>();

  email = '';

  ngOnChanges() {
    if (this.visible && !this.email) {
      this.email = this.initialEmail;
    }
  }

  onClose() {
    this.visibleChange.emit(false);
  }

  onSend() {
    if (this.isValidEmail()) {
      this.send.emit(this.email);
    }
  }

  isValidEmail(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email);
  }
}
