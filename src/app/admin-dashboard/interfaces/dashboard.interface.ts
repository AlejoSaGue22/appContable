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
    ingresosHeight?: number;
    egresosHeight?: number;
}

export interface DashboardResponse {
    sales: {
        totalMonth: number;
        totalLastMonth: number;
        comparison: number;
        trend: 'up' | 'down';
    };
    portfolio: {
        receivable: {
            total: number;
            overdue: number;
            nextMaturities: number;
        };
        payable: {
            total: number;
            overdue: number;
            nextMaturities: number;
        };
    };
    expenses: {
        totalMonth: number;
        totalLastMonth: number;
        comparison: number;
    };
    cash: {
        totalAvailable: number;
        accounts: {
            name: string;
            balance: number;
        }[];
    };
    recentTransactions: RecentTransaction[];
    history: DashboardHistory[];
}
