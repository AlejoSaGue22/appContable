import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { debounceTime, filter } from 'rxjs/operators';
import { initFlowbite } from 'flowbite';

@Injectable({
  providedIn: 'root'
})
export class FlowbiteService {
  
  private initialized = false;

  constructor(private router: Router) {
    this.initializeFlowbiteGlobal();
  }

  private initializeFlowbiteGlobal() {
    // Inicializar en la carga inicial
    this.initializeOnce();

    // Reinicializar en cada cambio de ruta
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        debounceTime(600)
      )
      .subscribe(() => {
        this.reinitialize();
      });
  }

  private initializeOnce() {
    if (!this.initialized) {
      // Delay para asegurar que el DOM esté listo
      setTimeout(() => {
        initFlowbite();
        this.initialized = true;
        console.log('Flowbite inicializado globalmente');
      }, 100);
    }
  }

  private reinitialize() {
    // Pequeño delay para que Angular renderice el nuevo componente
    setTimeout(() => {
      initFlowbite();
      console.log('Flowbite reinicializado después de navegación');
    }, 200);
  }

  // Método público para reinicializar manualmente si es necesario
  public forceReinitialize() {
    this.reinitialize();
  }
}