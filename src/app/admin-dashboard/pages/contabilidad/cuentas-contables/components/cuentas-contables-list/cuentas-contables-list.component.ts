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

  // Filter accounts to show only if all their ancestors are expanded
  visibleCuentas = computed(() => {
    const sorted = this.allCuentasSorted();
    const expanded = this.expandedIds();
    
    return sorted.filter(cuenta => {
      // Level 1 accounts are always visible
      if (cuenta.nivel === 1) return true;
      
      // For deeper levels, check if parent is expanded
      // We need to verify that ALL parents up to nivel 1 are expanded
      let currentPadreId = cuenta.cuentaPadreId;
      while (currentPadreId) {
        if (!expanded.has(currentPadreId)) return false;
        
        // Find the parent account to get its parentId
        const padre = sorted.find(c => c.id === currentPadreId);
        currentPadreId = padre?.cuentaPadreId || null;
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
    // or if there are other accounts pointing to it as parent.
    // Usually level 1-3 always have children in a PUC.
    return !cuenta.aceptaMovimiento;
  }
}
