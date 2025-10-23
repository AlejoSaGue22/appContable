import { Component, effect, input, linkedSignal, OnInit, signal } from '@angular/core';
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

export class TableListComponent implements OnInit {

    columns = input.required<Column[]>();
    dataTable = input<any[]>([]);
    hasAction = input<boolean>(true);
    rutaLink = input.required<string>();

    inputValue = signal<string>('');
    dataTableTemp = signal<any[]>([]);

    ngOnInit(): void {
        this.dataTableTemp.set(this.dataTable());
    }

    debouncedTime = effect((onCleanup) => {
          const value = this.inputValue();

          const timeout = setTimeout(() => {
                this.onSearch(value);        
          }, 700);

          onCleanup(() => clearTimeout(timeout));
    });

    get messageHead(){
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
        let aux =  Object.entries(item);

        return 'down' + aux[0][1] + index;
    } 





}
