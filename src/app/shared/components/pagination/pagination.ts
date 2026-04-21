import { Component, computed, inject, input, linkedSignal, OnDestroy } from '@angular/core';
import { RouterLink } from "@angular/router";
import { PaginationService } from './pagination.service';

@Component({
  selector: 'app-pagination',
  imports: [RouterLink],
  templateUrl: './pagination.html',
})
export class PaginationComponent implements OnDestroy { 

  paginationService = inject(PaginationService);
  length = input.required<number>();

  pages = computed(() => {
    return this.paginationService.pageSize() || 1;
  });

  selectPage = linkedSignal(this.paginationService.currentPage);
  
  getPagesList = computed(() => {
    return Array.from({ length: this.pages() }, (_, i) => i + 1);
  })

  ngOnDestroy(): void {
    this.paginationService.totalItems.set(0);
    this.paginationService.pageSize.set(10);
  }

}
