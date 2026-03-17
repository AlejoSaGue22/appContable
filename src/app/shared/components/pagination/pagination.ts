import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { RouterLink } from "@angular/router";
import { PaginationService } from './pagination.service';

@Component({
  selector: 'app-pagination',
  imports: [RouterLink],
  templateUrl: './pagination.html',
})
export class Pagination { 

  paginationService = inject(PaginationService);

  pages = computed(() => {
    return Math.ceil(this.paginationService.totalItems() / this.paginationService.pageSize());
  });

  selectPage = linkedSignal(this.paginationService.currentPage!);
  
  getPagesList = computed(() => {
    return Array.from({ length: this.pages() }, (_, i) => i + 1);
  })

}
