import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
 selector: 'app-empty-state',
 imports: [RouterLink],
 template: `
 <div class="flex flex-col items-center justify-center py-14 px-6 text-center">
 @if (icon()) {
 <div class="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
 <span [innerHTML]="icon()" class="h-8 w-8 text-gray-300"></span>
 </div>
 }
 <p class="text-sm font-bold text-gray-900">{{ title() }}</p>
 @if (description()) {
 <p class="mt-1 text-xs text-gray-400 max-w-xs">{{ description() }}</p>
 }
 @if (actionLabel()) {
 <div class="mt-6">
 @if (actionRoute()) {
 <a [routerLink]="actionRoute()"
 class="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
 </svg>
 {{ actionLabel() }}
 </a>
 } @else {
 <button (click)="actionClick.emit()"
 class="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 active:scale-95 cursor-pointer">
 <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
 </svg>
 {{ actionLabel() }}
 </button>
 }
 </div>
 }
 </div>
 `
})
export class EmptyStateComponent {
 icon = input<string>('');
 title = input.required<string>();
 description = input<string>('');
 actionLabel = input<string>('');
 actionRoute = input<string>('');
 actionClick = output<void>();
}
