import { Component, Input, OnChanges, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AsientosHttpService } from '../../services/asientos-http.service';

@Component({
  selector: 'app-preview-asiento',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './preview-asiento.component.html',
  styleUrls: ['./preview-asiento.component.css']
})
export class PreviewAsientoComponent implements OnChanges {
  @Input({ required: true }) documentId!: string;
  @Input({ required: true }) documentType!: string;
  @Input() refreshTrigger: any;

  private asientosService = inject(AsientosHttpService);

  previewData = signal<any>(null);
  loading = signal<boolean>(false);
  errorMsg = signal<string | null>(null);
  isOpen = signal<boolean>(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['documentId'] || changes['refreshTrigger']) {
      this.loadPreview();
    }
  }

  loadPreview(): void {
    if (!this.documentId || this.documentId === 'new' || this.documentId === 'new-Item') {
      this.previewData.set(null);
      this.errorMsg.set(null);
      return;
    }

    this.loading.set(true);
    this.errorMsg.set(null);

    this.asientosService.getPreview(this.documentType, this.documentId).subscribe({
      next: (res) => {
        this.previewData.set(res);
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMsg.set('No se pudo generar la simulación contable. Verifica la parametrización de cuentas del catálogo para este tipo de documento.');
        this.previewData.set(null);
        this.loading.set(false);
      }
    });
  }

  toggleOpen(): void {
    this.isOpen.update(v => !v);
  }
}
