import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoaderService {

  private loadindState = signal<boolean>(false);
  getLoading = computed(()=> this.loadindState());

  show(){
    this.loadindState.set(true);
  }

  hide(){
    this.loadindState.set(false);
  }

}
