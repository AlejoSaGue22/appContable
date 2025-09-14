import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';


export interface Column {
  key: string;
  header: string;
}

@Component({
  selector: 'app-table-list',
  imports: [RouterLink],
  templateUrl: './table-list.component.html',
})

export class TableListComponent {
    
    columns = input.required<Column[]>();
    dataTable = input<any[]>([]);
    hasAction = input<boolean>(true);
    rutaLink = input.required<string>();

    get messageHead(){
      const pages = this.rutaLink().split('/')[3];

      return pages;
    }
}
