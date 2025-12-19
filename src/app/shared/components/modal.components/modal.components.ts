import { Component, input, linkedSignal, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.components.html',
})
export class ModalComponents {

    visible = input<boolean>(true);
    visibleChange = output<boolean>();

    modalActive = linkedSignal(() => this.visible());

    close(){
        this.modalActive.set(false);
        this.visibleChange.emit(false);
    }

 }
