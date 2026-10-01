import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  forwardRef,
  HostListener,
  input,
  signal,
  computed,
  effect,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

/**
 * Componente reutilizable de Select con búsqueda.
 *
 * Uso básico:
 * ```html
 * <app-searchable-select
 *   formControlName="cuentaContableId"
 *   [items]="cuentasContables()"
 *   [labelKeys]="['codigo', 'nombre']"
 *   valueKey="id"
 *   placeholder="Buscar cuenta contable..."
 *   emptyLabel="Seleccionar cuenta..."
 * />
 * ```
 */
@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './searchable-select.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchableSelectComponent),
      multi: true,
    },
  ],
  host: {
    'class': 'block w-full'
  }
})
export class SearchableSelectComponent implements ControlValueAccessor {
  /** Lista de objetos a mostrar */
  items = input<any[]>([]);

  /** Claves del objeto a usar como etiqueta visible (se unen con " - ") */
  labelKeys = input<string[]>(['nombre']);

  /** Clave del objeto que se usa como valor del control (e.g. 'id') */
  valueKey = input<string>('id');

  /** Separator para unir las labelKeys */
  labelSeparator = input<string>(' - ');

  /** Placeholder del campo de búsqueda */
  placeholder = input<string>('Buscar...');

  /** Etiqueta para estado sin selección */
  emptyLabel = input<string>('Seleccionar...');

  /** Max items visibles en el dropdown */
  maxResults = input<number>(80);

  /** Tamaño del componente: 'sm' para tablas, 'md' normal */
  size = input<'sm' | 'md'>('md');

  /** Si el componente está deshabilitado */
  isDisabled = signal(false);

  // ── Internal state ──
  searchTerm = signal('');
  dropdownOpen = signal(false);
  private _value = signal<any>(null);

  // ── CVA callbacks ──
  private _onChange = (_: any) => {};
  private _onTouched = () => {};

  constructor(private elRef: ElementRef) {}

  /** The currently selected item object (resolved from value) */
  selectedItem = computed(() => {
    const val = this._value();
    if (val == null || val === '') return null;
    const key = this.valueKey();
    return this.items().find(item => String(item[key]) === String(val)) ?? null;
  });

  /** Label of the selected item */
  selectedLabel = computed(() => {
    const item = this.selectedItem();
    return item ? this.buildLabel(item) : '';
  });

  /** Filtered results based on search */
  filteredItems = computed(() => {
    const q = this.searchTerm()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
    const list = this.items();
    const max = this.maxResults();

    if (!q.trim()) return list.slice(0, max);

    return list
      .filter(item => {
        const label = this.buildLabel(item)
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        return label.includes(q);
      })
      .slice(0, max);
  });

  /** Whether the truncation notice should show */
  showTruncationNotice = computed(() => {
    return this.items().length > this.maxResults() && this.filteredItems().length === this.maxResults();
  });

  // ── ControlValueAccessor ──
  writeValue(value: any): void {
    this._value.set(value);
  }

  registerOnChange(fn: any): void {
    this._onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this._onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  // ── Public methods ──
  buildLabel(item: any): string {
    return this.labelKeys()
      .map(key => String(item[key] ?? '').trim())
      .filter(Boolean)
      .join(this.labelSeparator());
  }

  openDropdown(): void {
    if (this.isDisabled()) return;
    this.searchTerm.set('');
    this.dropdownOpen.set(true);
  }

  selectItem(item: any): void {
    const val = item[this.valueKey()];
    this._value.set(val);
    this._onChange(val);
    this._onTouched();
    this.dropdownOpen.set(false);
    this.searchTerm.set('');
  }

  clearSelection(event?: MouseEvent): void {
    event?.stopPropagation();
    this._value.set(null);
    this._onChange(null);
    this._onTouched();
    this.searchTerm.set('');
    this.dropdownOpen.set(false);
  }

  onSearchInput(value: string): void {
    this.searchTerm.set(value);
    if (!this.dropdownOpen()) this.dropdownOpen.set(true);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.dropdownOpen.set(false);
      this.searchTerm.set('');
    }
  }
}
