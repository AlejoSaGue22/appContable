import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  forwardRef,
  HostListener,
  input,
  signal,
  effect,
  computed,
  output,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

@Component({
  selector: 'app-list-group-dropdown',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './list-group-dropdown.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ListGroupDropdownComponent),
      multi: true,
    },
  ],
})
export class ListGroupDropdownComponent<
  T extends Record<string, any>,
> implements ControlValueAccessor {
  title = input.required<string>();

  dataList = input<T[]>([]);
  valueInput = input<string>('');
  labelKey = input<string[]>([]);
  objectSelect = output<T>();
  createOption = output<void>(); // Evento para crear nuevo
  searchOption = signal<string>('');
  showDropdown = signal<boolean>(false);
  searchable = input<boolean>(true);

  constructor(private elementRef: ElementRef) {
    effect(() => {
      if (this.valueInput()) {
        this.searchOption.set(this.getLabelForValue(this.valueInput()));
      }
    });
  }

  getLabelForValue(val: any): string {
    if (!val) return '';
    if (typeof val === 'object') {
      return this.buildLabel(val);
    }
    const strVal = String(val);
    const list = this.dataList();
    if (list && list.length > 0) {
      const keys = this.labelKey();
      const firstKey = keys[0];
      const match = list.find(
        (item) =>
          String(item[firstKey] ?? '') === strVal ||
          String(item['id'] ?? '') === strVal ||
          String(item['codigo'] ?? '') === strVal,
      );
      if (match) {
        return this.buildLabel(match);
      }
    }
    return strVal;
  }

  filteredOptions = computed(() => {
    const list = this.dataList();
    const term = this.searchOption().toLowerCase();

    if (!term.trim()) return list;

    return list.filter((item) =>
      this.buildLabel(item).toLowerCase().includes(term),
    );
  });

  buildLabel(item: T): string {
    const keys = this.labelKey();
    return keys
      .map((key) => String(item[key] ?? '').trim())
      .filter(Boolean)
      .join(' - ');
  }

  // ------- CONTROL VALUE ACCESSOR ------- //
  private _value: T | null = null;
  onChange = (_: any) => {};
  onTouched = () => {};

  writeValue(value: T | null): void {
    this._value = value;
    this.searchOption.set(this.getLabelForValue(value));
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  set value(val: T | null) {
    this._value = val;
    this.onChange(val);
    this.searchOption.set(this.getLabelForValue(val));
  }

  get value(): T | null {
    return this._value;
  }

  // ------- FUNCIONES DEL COMPONENTE ------- //

  onSearchChange(event: any) {
    this.searchOption.set(event.target.value);
    this.showDropdown.set(true);
  }

  selectedItem(item: T) {
    this.value = item[this.labelKey()[0]];
    this.objectSelect.emit(item);
    this.searchOption.set(this.buildLabel(item));
    this.showDropdown.set(false);
  }

  onCreateNew() {
    this.createOption.emit();
    this.showDropdown.set(false);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      // this.filteredOptions.set(this.dataList());
      this.showDropdown.set(false);
    }
  }
}
