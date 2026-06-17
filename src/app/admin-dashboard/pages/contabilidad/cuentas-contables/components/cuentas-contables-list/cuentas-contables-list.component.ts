import { Component, EventEmitter, Output, computed, input, signal } from '@angular/core';
import { GetCuentasContables } from '@dashboard/interfaces/catalogs-interface';
import { CommonModule } from '@angular/common';

@Component({
 selector: 'app-cuentas-contables-list',
 standalone: true,
 imports: [CommonModule],
 templateUrl: './cuentas-contables-list.component.html',
 host: {
 class: 'flex flex-col h-full overflow-hidden'
 }
})
export class CuentasContablesList {

 cuentas = input<GetCuentasContables[]>([]);
 selectedId = input<string | null>(null);

 @Output() selectAccount = new EventEmitter<GetCuentasContables>();
 @Output() addSubAccount = new EventEmitter<GetCuentasContables>();

 expandedIds = signal<Set<string>>(new Set<string>());

 allCuentasSorted = computed(() => {
 return [...(this.cuentas() || [])].sort((a, b) => a.codigo.localeCompare(b.codigo));
 });

 getDerivedLevel(codigo: string): number {
 const len = codigo.length;
 if (len === 1) return 1;
 if (len === 2) return 2;
 if (len <= 4) return 3;
 if (len <= 6) return 4;
 return 5;
 }

 visibleCuentas = computed(() => {
 const sorted = this.allCuentasSorted();
 const expanded = this.expandedIds();
 const codeToId = new Map(sorted.map(c => [c.codigo, c.id]));

 return sorted.filter(cuenta => {
 const code = cuenta.codigo;
 const level = this.getDerivedLevel(code);
 if (level === 1) return true;

 const prefixes = [];
 if (code.length > 1) prefixes.push(code.substring(0, 1));
 if (code.length > 2) prefixes.push(code.substring(0, 2));
 if (code.length > 4) prefixes.push(code.substring(0, 4));
 if (code.length > 6) {
 for (let i = 6; i < code.length; i += 2) {
 prefixes.push(code.substring(0, i));
 }
 }

 for (const prefix of prefixes) {
 const pId = codeToId.get(prefix);
 if (pId && !expanded.has(pId)) return false;
 }
 return true;
 });
 });

 toggleExpand(event: Event, id: string): void {
 event.stopPropagation();
 const current = new Set(this.expandedIds());
 if (current.has(id)) {
 current.delete(id);
 } else {
 current.add(id);
 }
 this.expandedIds.set(current);
 }

 isExpanded(id: string): boolean {
 return this.expandedIds().has(id);
 }

 hasChildren(cuenta: GetCuentasContables): boolean {
 
 return !cuenta.aceptaMovimiento;
 }

 onSelect(cuenta: GetCuentasContables): void {
 const current = new Set(this.expandedIds());
 if (!current.has(cuenta.id)) {
 current.add(cuenta.id);
 this.expandedIds.set(current);
 }
 this.selectAccount.emit(cuenta);
 }

 onAdd(event: Event, cuenta: GetCuentasContables): void {
 event.stopPropagation();
 
 const current = new Set(this.expandedIds());
 if (!current.has(cuenta.id)) {
 current.add(cuenta.id);
 this.expandedIds.set(current);
 }

 this.addSubAccount.emit(cuenta);
 }
}
