import { Component, computed, inject, input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Icono determinista del sidebar/menú (standalone).
 * Soporta los 3 formatos de `menu.icon` del backend:
 * - HTML completo: `<i class="fa-solid fa-hand-holding-dollar"></i>` o `<svg ...>`
 * - Clase FA directa: `fa-solid fa-home`
 * - Nombre Material Symbols: `dashboard`
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  template: `<span class="app-icon" [innerHTML]="safeHtml()"></span>`,
})
export class AppIconComponent {
  icon = input<string | null | undefined>('');
  class = input<string>('');

  private sanitizer = inject(DomSanitizer);

  safeHtml = computed<SafeHtml>(() => {
    const html = AppIconComponent.renderIcon(this.icon() ?? '', this.class());
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  static renderIcon(icon: string, extraClass = ''): string {
    if (!icon) {
      return '';
    }
    const v = icon.trim();
    if (!v) {
      return '';
    }
    const cls = extraClass ? ` ${extraClass}` : '';

    // Ya es HTML (SVG o <i>): se devuelve tal cual para sanitización del componente
    if (v.startsWith('<')) {
      return v;
    }

    // Clase FontAwesome directa
    if (v.includes('fa-')) {
      return `<i class="${v}${cls}"></i>`;
    }

    // Nombre Material Symbols (self-host, sin CDN)
    return `<span class="material-symbols-outlined${cls}">${v}</span>`;
  }
}
