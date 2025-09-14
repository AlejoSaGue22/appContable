import { CommonModule, TitleCasePipe } from '@angular/common';
import {  Component, effect, ElementRef, forwardRef, HostListener, input, OnInit, output, signal } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-list-group-dropdown',
  imports: [TitleCasePipe, FormsModule, CommonModule],
  templateUrl: './list-group-dropdown.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => ListGroupDropdownComponent),
      multi: true
    }
  ]
})
export class ListGroupDropdownComponent implements OnInit, ControlValueAccessor {

  title = input.required<string>();
  dataList = input<string[]>([]);

  public filteredOptions = signal<string[]>([]);
  showDropdown = signal<boolean>(false);
  searchOption: string = '';

  private _value: any = '';
  onChange = (_: any) => {};
  onTouched = () => {};

  constructor(private elementRef: ElementRef) {
      effect(() => {
        this.filteredOptions.set(this.dataList());
        this.searchOption = this.value;
      });
  }

  ngOnInit(): void {}

  writeValue(value: any): void {
    if (value !== undefined && value !== null) {
      this._value = value;
      this.searchOption = value;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  get value(): any {
    return this._value;
  }

  set value(val: any) {
    this._value = val;
    this.onChange(val);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.showDropdown.set(false);
    }
  }

  onSearchChange() {
    const dataFilter = this.dataList().filter(item => item.toLowerCase().includes(this.searchOption.toLowerCase()));
    this.filteredOptions.set(dataFilter);
    this.showDropdown.set(true);
    this.onChange(this.searchOption);
  }

  selectedItem(item: string) {
    this.searchOption = item;
    this.value = item; // Esto llama al setter y notifica a los cambios del formulario
    this.showDropdown.set(false);
  }

  toggleDropdown() {
    this.showDropdown.set(!this.showDropdown());
    if (this.showDropdown()) {
      this.filteredOptions.set(this.dataList());
    }
  }
 }
