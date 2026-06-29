import { Component, input, linkedSignal, output, ElementRef, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-modal',
  imports: [],
  templateUrl: './modal.components.html',
  standalone: true,
})
export class ModalComponents implements OnInit, OnDestroy {
  visible = input<boolean>(true);
  visibleChange = output<boolean>();

  modalActive = linkedSignal(() => this.visible());

  constructor(
    private el: ElementRef,
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      this.document.body.appendChild(this.el.nativeElement);
    }
  }

  ngOnDestroy() {
    if (isPlatformBrowser(this.platformId)) {
      this.el.nativeElement.remove();
    }
  }

  close() {
    this.modalActive.set(false);
    this.visibleChange.emit(false);
  }
}
