import { Component, computed, input, signal } from '@angular/core';
import { GetCuentasContables } from '@dashboard/interfaces/catalogs-interface';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { NotificationService } from '@shared/services/notification.service';
import { inject } from '@angular/core';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-balance-cuentas-table',
  standalone: true,
  imports: [CurrencyPipe, CommonModule],
  templateUrl: './balance-cuentas-table.component.html',
})
export class BalanceCuentasTableComponent {

  cuentas = input<GetCuentasContables[]>([]);

  expandedIds = signal<Set<string>>(new Set<string>());
  private notification = inject(NotificationService);

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

      const prefixes: string[] = [];
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
    return !cuenta.aceptaMovimiento;
  }

  exportarExcel(): void {
    const cuentas = this.cuentas();
    if (!cuentas.length) {
      this.notification.info('Sin datos para exportar', 'Información');
      return;
    }
    const data = cuentas.map((c) => ({
      Código: c.codigo,
      Nombre: c.nombre,
      Naturaleza: c.naturaleza,
      Débitos: c.totalDebito,
      Créditos: c.totalCredito,
      Saldo: c.saldo,
      Estado: c.isActive ? 'Activa' : 'Inactiva',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Balance Contable');
    XLSX.writeFile(wb, `BalanceContable.xlsx`);
  }
}
