import { Component, effect, inject, input, OnInit, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Pagination } from '../pagination/pagination';
import { modalOpen } from '@shared/interfaces/services.interfaces';
import { PaginationService } from '../pagination/pagination.service';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';

export interface Column {
  key: string;
  header: string;
  type?: string;
}

@Component({
  selector: 'app-table-list',
  imports: [RouterLink, Pagination, TitleCasePipe, CurrencyPipe],
  templateUrl: './table-list.component.html',
})

export class TableListComponent implements OnInit {

  columns = input.required<Column[]>();
  dataTable = input<any[]>([]);
  hasAction = input<boolean>(true);
  pages = input<number>(1);
  rutaLink = input.required<string>();
  modalOpen = output<modalOpen>();

  inputValue = signal<string>('');
  dataTableTemp = signal<any[]>([]);
  paginationServices = inject(PaginationService);



  debouncedTime = effect((onCleanup) => {
    const value = this.inputValue();

    const timeout = setTimeout(() => {
      this.onSearch(value);
    }, 700);

    onCleanup(() => clearTimeout(timeout));
  });



  ngOnInit(): void {
    this.dataTableTemp.set(this.dataTable());
  }


  get messageHead() {
    const pages = this.rutaLink().split('/')[3];
    return pages;
  }

  onSearch(value: string) {
    const filtered = this.dataTable().filter(item => {
      return Object.keys(item).some(key => {
        const propValue = item[key];
        return typeof propValue === 'string' && propValue.toLowerCase().includes(value.toLowerCase());
      });
    });

    this.dataTableTemp.set(filtered);
  }


  dataDropdown(item: any, index: number) {
    // let aux =  Object.entries(item);

    return 'down' + item + index;
  }

  openModal(id: string) {
    this.modalOpen.emit({ open: true, id });
  }

}
