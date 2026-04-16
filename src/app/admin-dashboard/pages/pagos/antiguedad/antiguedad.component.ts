import { Component, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgingReporte } from '@dashboard/interfaces/pagos-interface';
import { PagosHttpService } from '../services/pagos.service';
import { HeaderTitlePageComponent, HeaderInput } from "@dashboard/components/header-title-page/header-title-page.component";


@Component({
  selector: 'app-antiguedad',
  standalone: true,
  imports: [CommonModule, HeaderTitlePageComponent],
  templateUrl: './antiguedad.component.html',
})
export class AntiguedadComponent implements OnInit {
  headTitle = signal<HeaderInput>({ title: 'Antigüedad de Cartera', slog: 'Análisis de vencimientos por tramos de tiempo' });

  vistaActiva = signal<'cobrar' | 'pagar'>('cobrar');

  agingCobrar = signal<AgingReporte | null>(null);
  agingPagar  = signal<AgingReporte | null>(null);
  loadingCobrar = signal(false);
  loadingPagar  = signal(false);

  gruposAbiertos = signal<Set<string>>(new Set());
  searchQuery    = signal('');

  reporteFiltrado = computed(() => {
    const report = this.vistaActiva() === 'cobrar' ? this.agingCobrar() : this.agingPagar();
    if (!report) return null;

    const query = this.searchQuery().toLowerCase().trim();
    if (!query) return report;

    // Filtramos los grupos (clientes o proveedores) por nombre
    const filteredGrupos = report.grupos.filter(g => 
       g.contraparteNombre.toLowerCase().includes(query)
    );

    return {
      ...report,
      grupos: filteredGrupos
    };
  });

  readonly buckets: Array<{
    key: keyof AgingReporte['totales'];
    label:     string;
    bgClass:   string;
    textClass: string;
  }> = [
    { key: 'porVencer', label: 'Por Vencer', bgClass: 'bg-green-500',  textClass: 'text-green-700'  },
    { key: 'de1a30',    label: '1-30 días',  bgClass: 'bg-yellow-400', textClass: 'text-yellow-700' },
    { key: 'de31a60',   label: '31-60 días', bgClass: 'bg-orange-500', textClass: 'text-orange-700' },
    { key: 'de61a90',   label: '61-90 días', bgClass: 'bg-red-500',    textClass: 'text-red-700'    },
    { key: 'mas90',     label: '+90 días',   bgClass: 'bg-red-900',    textClass: 'text-red-900'    },
  ];

  constructor(private svc: PagosHttpService) {}

  ngOnInit(): void {
    this.cargarCobrar();
    this.cargarPagar();
  }

  cargarCobrar(): void {
    this.loadingCobrar.set(true);
    this.svc.getAgingCobrar().subscribe({
      next:  d  => { this.agingCobrar.set(d); this.loadingCobrar.set(false); },
      error: () => { this.loadingCobrar.set(false); },
    });
  }

  cargarPagar(): void {
    this.loadingPagar.set(true);
    this.svc.getAgingPagar().subscribe({
      next:  d  => { this.agingPagar.set(d); this.loadingPagar.set(false); },
      error: () => { this.loadingPagar.set(false); },
    });
  }

  toggleGrupo(id: string): void {
    const grupos = new Set(this.gruposAbiertos());
    if (grupos.has(id)) {
      grupos.delete(id);
    } else {
      grupos.add(id);
    }
    this.gruposAbiertos.set(grupos);
  }

  expandAll(): void {
    const report = this.reporteFiltrado();
    if (!report) return;
    const allIds = report.grupos.map(g => g.contraparteId);
    this.gruposAbiertos.set(new Set(allIds));
  }

  collapseAll(): void {
    this.gruposAbiertos.set(new Set());
  }

  pct(valor: number, total: number): number {
    return total === 0 ? 0 : Math.round((valor / total) * 100);
  }
}