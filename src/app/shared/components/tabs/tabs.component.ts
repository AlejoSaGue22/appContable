import { Component, input, model } from '@angular/core';

export interface TabItem {
  id: string;
  label: string;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  template: `
    @if (variant() === 'underline') {
      <div class="flex border-b border-gray-200 mb-3">
        @for (tab of tabs(); track tab.id) {
          <button
            (click)="activeTab.set(tab.id)"
            class="px-5 py-3 text-sm font-semibold cursor-pointer transition-all border-b-2 -mb-px"
            [class.border-blue-500]="
              activeTab() === tab.id && color() === 'blue'
            "
            [class.text-blue-600]="activeTab() === tab.id && color() === 'blue'"
            [class.bg-blue-50]="activeTab() === tab.id && color() === 'blue'"
            [class.border-green-600]="
              activeTab() === tab.id && color() === 'green'
            "
            [class.text-green-700]="
              activeTab() === tab.id && color() === 'green'
            "
            [class.border-orange-600]="
              activeTab() === tab.id && color() === 'orange'
            "
            [class.text-orange-700]="
              activeTab() === tab.id && color() === 'orange'
            "
            [class.border-transparent]="activeTab() !== tab.id"
            [class.text-gray-500]="activeTab() !== tab.id"
            [class.hover:text-gray-700]="activeTab() !== tab.id"
            [class.hover:border-gray-300]="activeTab() !== tab.id"
          >
            {{ tab.label }}
          </button>
        }
      </div>
    }

    @if (variant() === 'pills') {
      <div
        class="flex items-center p-1 bg-gray-100/50 backdrop-blur-md rounded-2xl w-fit flex-wrap gap-1 mb-3"
      >
        @for (tab of tabs(); track tab.id) {
          <button
            (click)="activeTab.set(tab.id)"
            class="px-6 py-2.5 rounded-xl text-md font-bold transition-all duration-300 cursor-pointer"
            [class.bg-white]="activeTab() === tab.id"
            [class.text-blue-600]="activeTab() === tab.id"
            [class.shadow-sm]="activeTab() === tab.id"
            [class.text-gray-500]="activeTab() !== tab.id"
            [class.hover:text-gray-900]="activeTab() !== tab.id"
          >
            {{ tab.label }}
          </button>
        }
      </div>
    }
  `,
})
export class TabsComponent {
  tabs = input.required<TabItem[]>();
  activeTab = model.required<string>();
  variant = input<'underline' | 'pills'>('underline');
  color = input<'blue' | 'green' | 'orange'>('blue');
}
