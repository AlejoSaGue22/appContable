import { Component, computed, inject, input, linkedSignal, OnDestroy } from '@angular/core';
import { RouterLink } from "@angular/router";
import { PaginationService } from './pagination.service';

export interface PaginationItem {
    isPage: boolean;
    page: number;
    label: string;
}

@Component({
    selector: 'app-pagination',
    imports: [RouterLink],
    templateUrl: './pagination.html',
})
export class PaginationComponent implements OnDestroy {

    paginationService = inject(PaginationService);
    length = input.required<number>();

    pages = computed(() => {
        return Math.max(1, this.paginationService.pageSize() || 1);
    });

    selectPage = linkedSignal(this.paginationService.currentPage);

    getPagesList = computed<PaginationItem[]>(() => {
        const total = this.pages();
        const current = Math.max(1, Math.min(this.selectPage(), total));

        // Si son 7 páginas o menos, mostramos todas directamente
        if (total <= 7) {
            return Array.from({ length: total }, (_, i) => ({
                isPage: true,
                page: i + 1,
                label: (i + 1).toString(),
            }));
        }

        const items: PaginationItem[] = [];

        // Caso 1: Cerca del inicio (páginas 1 a 4)
        if (current <= 4) {
            for (let i = 1; i <= 5; i++) {
                items.push({ isPage: true, page: i, label: i.toString() });
            }
            items.push({ isPage: false, page: 0, label: '...' });
            items.push({ isPage: true, page: total, label: total.toString() });
            return items;
        }

        // Caso 2: Cerca del final (últimas 4 páginas)
        if (current >= total - 3) {
            items.push({ isPage: true, page: 1, label: '1' });
            items.push({ isPage: false, page: 0, label: '...' });
            for (let i = total - 4; i <= total; i++) {
                items.push({ isPage: true, page: i, label: i.toString() });
            }
            return items;
        }

        // Caso 3: En el medio
        items.push({ isPage: true, page: 1, label: '1' });
        items.push({ isPage: false, page: 0, label: '...' });
        items.push({ isPage: true, page: current - 1, label: (current - 1).toString() });
        items.push({ isPage: true, page: current, label: current.toString() });
        items.push({ isPage: true, page: current + 1, label: (current + 1).toString() });
        items.push({ isPage: false, page: 0, label: '...' });
        items.push({ isPage: true, page: total, label: total.toString() });

        return items;
    });

    ngOnDestroy(): void {
        this.paginationService.totalItems.set(0);
        this.paginationService.pageSize.set(1);
    }

}

