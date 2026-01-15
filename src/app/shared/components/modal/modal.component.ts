import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [],
  templateUrl: './modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {

  visible = model<boolean>(false);
  title = input<string>('');
  width = input<string>('max-w-2xl');

  close() {
    this.visible.set(false);
  }

 }
