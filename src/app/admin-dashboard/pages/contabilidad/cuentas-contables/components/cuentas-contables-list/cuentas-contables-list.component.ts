import { Component, computed, input, signal } from '@angular/core';
import { GetCuentasContables } from '@dashboard/interfaces/catalogs-interface';
import { CurrencyPipe, CommonModule } from '@angular/common';

@Component({
  selector: 'app-cuentas-contables-list',
  standalone: true,
  imports: [CurrencyPipe, CommonModule],
  templateUrl: './cuentas-contables-list.component.html',
})
export class CuentasContablesList {

  cuentas = input<GetCuentasContables[]>([]);
  
  // State for expanded account IDs
  expandedIds = signal<Set<string>>(new Set<string>());

  // Sort accounts initially by code
  allCuentasSorted = computed(() => {
    return [...(this.cuentas() || [])].sort((a, b) => a.codigo.localeCompare(b.codigo));
  });

  // Helper to determine level based on code length (standard PUC)
  getDerivedLevel(codigo: string): number {
    const len = codigo.length;
    if (len === 1) return 1;
    if (len === 2) return 2;
    if (len <= 4) return 3;
    if (len <= 6) return 4;
    return 5;
  }

  // Filter accounts to show only if all their ancestors are expanded
  visibleCuentas = computed(() => {
    const sorted = this.allCuentasSorted();
    const expanded = this.expandedIds();
    
    // Map for quick lookup of code to ID
    const codeToId = new Map(sorted.map(c => [c.codigo, c.id]));

    return sorted.filter(cuenta => {
      const code = cuenta.codigo;
      const level = this.getDerivedLevel(code);
      
      // Level 1 accounts are always visible
      if (level === 1) return true;
      
      // For deeper levels, check all potential parent prefixes
      const prefixes = [];
      if (code.length > 1) prefixes.push(code.substring(0, 1));
      if (code.length > 2) prefixes.push(code.substring(0, 2));
      if (code.length > 4) prefixes.push(code.substring(0, 4));
      if (code.length > 6) {
        // For lengths > 6, they go in steps of 2 (8, 10, etc.)
        for (let i = 6; i < code.length; i += 2) {
          prefixes.push(code.substring(0, i));
        }
      }

      for (const prefix of prefixes) {
        const pId = codeToId.get(prefix);
        // If a parent exists and is not expanded, this account is hidden
        if (pId && !expanded.has(pId)) return false;
      }
      
      return true;
    });
  });

  toggleExpand(id: string): void {
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
    // An account has children if it doesn't accept movements (it's a group account)
    return !cuenta.aceptaMovimiento;
  }
}
