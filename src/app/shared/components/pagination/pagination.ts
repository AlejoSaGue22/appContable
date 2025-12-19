import { Component, computed, input, linkedSignal } from '@angular/core';
import { RouterLink } from "@angular/router";

@Component({
  selector: 'app-pagination',
  imports: [RouterLink],
  templateUrl: './pagination.html',
})
export class Pagination { 

  pages = input(0);
  
  currentPages = input<number>(1);
  selectPage = linkedSignal(this.currentPages);

  getPagesList = computed(() => {
    return Array.from({ length: this.pages() }, (_, i) => i + 1);
  })

  nextPage(){
    // this.selectPage.set
  }

}


