import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  private loadindState = signal<boolean>(false);
  private message = signal<string>('Cargando...');
  
  getLoading = computed(()=> this.loadindState());
  getMessage = computed(() => this.message());

  show(msg: string = 'Cargando...'){
    this.message.set(msg);
    this.loadindState.set(true);
  }

  hide(){
    this.loadindState.set(false);
  }

}
