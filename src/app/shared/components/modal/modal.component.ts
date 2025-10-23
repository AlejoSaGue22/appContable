import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalComponent {

  visible = input<boolean>(false);
  visibleChange = input<(visible: boolean) => void>(() => {});

  close() {
    this.visibleChange(false);
  }

 }
