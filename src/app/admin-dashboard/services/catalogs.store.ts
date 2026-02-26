import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin, tap, catchError, of, filter } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { CatalogsService } from './catalogs.service';
import { CatalogsState } from '../interfaces/catalogs-interface';
import { AuthService } from 'src/app/auth/services/auth.service';
import { ClientesService } from '../pages/ventas/services/clientes.service';

@Injectable({
  providedIn: 'root'
})
export class CatalogsStore {
  private catalogsService = inject(CatalogsService);
  private clientesService = inject(ClientesService);
  private authService = inject(AuthService);

  private state = signal<CatalogsState>({
    documentTypes: [],
    paymentMethods: [],
    salesChannels: [],
    unitsMeasure: [],
    municipalities: [],
    categoriesArticles: [],
    loading: false,
    error: null
  });

  constructor() {
    // Single subscription to handle all auth status changes
    toObservable(this.authService.authStatus).subscribe(status => {
      if (status === 'authenticated') {
        this.initialize();
      } else if (status === 'not-authenticated') {
        this.clear();
      }
    });
  }

  categoriesArticles = computed(() => this.state().categoriesArticles);
  documentTypes = computed(() => this.state().documentTypes);
  paymentMethods = computed(() => this.state().paymentMethods);
  salesChannels = computed(() => this.state().salesChannels);
  unitsMeasure = computed(() => this.state().unitsMeasure);
  municipalities = computed(() => this.state().municipalities);
  loading = computed(() => this.state().loading);
  error = computed(() => this.state().error);

  initialize() {
    // Prevent duplicate calls if already loading or if data is already present
    if (this.state().loading || this.state().documentTypes.length > 0) return;
        this.state.update(s => ({ ...s, loading: true, error: null }));

        forkJoin({
              categoriesArticles: this.catalogsService.findAllCategoriesArticles(),
              municipalities: this.clientesService.getMunicipalities(),
              documentTypes: this.catalogsService.findAllDocumentTypes(),
              paymentMethods: this.catalogsService.findAllPaymentMethods(),
              salesChannels: this.catalogsService.findAllSalesChannels(),
              unitsMeasure: this.catalogsService.findAllUnitsMeasure()
        }).pipe(
          tap(({ categoriesArticles, documentTypes, paymentMethods, salesChannels, unitsMeasure, municipalities }) => {
            this.state.set({
              categoriesArticles,
              documentTypes,
              paymentMethods,
              salesChannels,
              unitsMeasure,
              municipalities,
              loading: false,
              error: null
            });
          }),
          catchError(error => {
            console.error('Error fetching catalogs:', error);
            this.state.update(s => ({
              ...s,
              loading: false,
              error: 'Failed to load catalogs'
            }));
            return of(null);
          })
        ).subscribe();
    }

  clear() {
    this.state.set({
      documentTypes: [],
      paymentMethods: [],
      salesChannels: [],
      unitsMeasure: [],
      municipalities: [],
      categoriesArticles: [],
      loading: false,
      error: null
    });
  }
}
