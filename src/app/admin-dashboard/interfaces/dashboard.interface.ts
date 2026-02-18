export interface DashboardTotals {
    ingresos: number;
    egresos: number;
    compras: number;
    utilidad: number;
    saldoCaja: number;
}

export interface RecentTransaction {
    id: string;
    type: 'venta' | 'compra';
    numero: string;
    entidad: string;
    total: number;
    fecha: string;
    status: string;
}

export interface DashboardHistory {
    month: string;
    ingresos: number;
    egresos: number;
}

export interface DashboardResponse {
    totals: DashboardTotals;
    recentTransactions: RecentTransaction[];
    history: DashboardHistory[];
}
