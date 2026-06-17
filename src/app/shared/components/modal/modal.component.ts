import { Component, HostListener, input, model } from '@angular/core';

@Component({
 selector: 'app-modal',
 standalone: true,
 imports: [],
 templateUrl: './modal.component.html',
})
export class ModalComponent {

 visible = model<boolean>(false);
 title = input<string>('');
 size = input<'sm' | 'md' | 'lg' | 'xl' | 'full'>('md');
 closable = input<boolean>(true);

 sizeClass = {
 sm: 'max-w-md',
 md: 'max-w-2xl',
 lg: 'max-w-4xl',
 xl: 'max-w-6xl',
 full: 'max-w-[90vw]',
 };

 @HostListener('document:keydown.escape')
 onEscape() {
 if (this.closable()) {
 this.close();
 }
 }

 close() {
 this.visible.set(false);
 }
}
