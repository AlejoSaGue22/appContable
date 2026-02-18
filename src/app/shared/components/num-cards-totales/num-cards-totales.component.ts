import { Component, input } from '@angular/core';
import { CurrencyPipe, NgClass } from '@angular/common';

export interface CardsTotales {
  title: string;
  valor: string;
  percent: string;
}

type optionIcon = 'S' | 'N';

@Component({
  selector: 'num-cards-totales',
  imports: [NgClass, CurrencyPipe],
  templateUrl: './num-cards-totales.component.html',
  styles: `
    .dashboard-card {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .dashboard-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
    }

    .icon-container {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      transition: transform 0.3s ease;
    }

    .dashboard-card:hover .icon-container {
      transform: scale(1.1) rotate(-5deg);
    }
    
    .glass-effect {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(8px);
    }
  `
})
export class NumCardsTotalesComponent {

  itemsValores = input.required<CardsTotales[]>();
  iconDolar = input<optionIcon>('S');

  getCardTheme(title: string) {
    const t = title.toLowerCase();
    if (t.includes('ingresos')) return {
      bg: 'bg-emerald-50',
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      icon: 'M12 4v16m8-8H4', // plus icon
      path: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6'
    };
    if (t.includes('egresos')) return {
      bg: 'bg-rose-50',
      iconBg: 'bg-rose-100',
      iconColor: 'text-rose-600',
      icon: 'M20 12H4', // minus icon
      path: 'M13 17h8m0 0V9m0 8l-8-8-4 4-6-6'
    };
    if (t.includes('compras')) return {
      bg: 'bg-amber-50',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
      icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z', // shopping cart
      path: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z'
    };
    if (t.includes('utilidad')) return {
      bg: 'bg-indigo-50',
      iconBg: 'bg-indigo-100',
      iconColor: 'text-indigo-600',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z', // bar chart
      path: 'M9 19V9l12-3'
    };
    return {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z', // wallet/bank
      path: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
    };
  }
}
