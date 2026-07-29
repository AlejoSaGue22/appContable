import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Directive({
  selector: '[appCurrencyFormat]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CurrencyFormatDirective),
      multi: true,
    },
  ],
})
export class CurrencyFormatDirective implements ControlValueAccessor {
  @Input() allowDecimals = true;
  @Input() decimalPlaces = 2;
  @Input() thousandSeparator = '.';
  @Input() decimalSeparator = ',';

  private onChange: (val: number | null) => void = () => {};
  private onTouched: () => void = () => {};
  private rawValue: number | null = null;

  constructor(private el: ElementRef<HTMLInputElement>) {}

  private formatValue(val: number | null | string): string {
    if (val === null || val === undefined || val === '') return '';
    const num = typeof val === 'number' ? val : this.parseRawNumber(String(val));
    if (isNaN(num) || num === 0) {
      if (val === 0 || val === '0') return '0';
      return '';
    }

    const parts = num.toString().split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, this.thousandSeparator);

    if (this.allowDecimals && parts.length > 1) {
      const decimalPart = parts[1].substring(0, this.decimalPlaces);
      return `${integerPart}${this.decimalSeparator}${decimalPart}`;
    }

    return integerPart;
  }

  private parseRawNumber(str: string): number {
    if (!str) return 0;
    const clean = str
      .split(this.thousandSeparator)
      .join('')
      .replace(this.decimalSeparator, '.');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
  }

  @HostListener('input', ['$event.target.value'])
  onInput(value: string) {
    const cleanString = value.replace(/[^0-9]/g, '');
    if (!cleanString) {
      this.rawValue = null;
      this.onChange(null);
      this.el.nativeElement.value = '';
      return;
    }

    const num = parseFloat(cleanString);
    this.rawValue = num;
    this.onChange(num);

    const formatted = this.formatValue(num);
    this.el.nativeElement.value = formatted;
  }

  @HostListener('blur')
  onBlur() {
    this.onTouched();
    if (this.rawValue !== null && this.rawValue !== undefined) {
      this.el.nativeElement.value = this.formatValue(this.rawValue);
    }
  }

  @HostListener('focus')
  onFocus() {
    this.el.nativeElement.select();
  }

  // --- ControlValueAccessor Methods ---
  writeValue(value: any): void {
    if (value === null || value === undefined || value === '') {
      this.rawValue = null;
      this.el.nativeElement.value = '';
    } else {
      const num = typeof value === 'number' ? value : parseFloat(value);
      this.rawValue = isNaN(num) ? null : num;
      this.el.nativeElement.value = this.formatValue(this.rawValue);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.el.nativeElement.disabled = isDisabled;
  }
}
