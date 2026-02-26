import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/app/environments/environment';
import { CategoryArticle, DocumentType, PaymentMethod, SalesChannel, UnitMeasure } from '../interfaces/catalogs-interface';

@Injectable({
  providedIn: 'root'
})
export class CatalogsService {
  private http = inject(HttpClient);
  private baseUrl = environment.baseUrl;

  findAllDocumentTypes(): Observable<DocumentType[]> {
    return this.http.get<DocumentType[]>(`${this.baseUrl}/catalogs/document-types`);
  }

  findAllPaymentMethods(): Observable<PaymentMethod[]> {
    return this.http.get<PaymentMethod[]>(`${this.baseUrl}/catalogs/payment-methods`);
  }

  findAllSalesChannels(): Observable<SalesChannel[]> {
    return this.http.get<SalesChannel[]>(`${this.baseUrl}/catalogs/sales-channels`);
  }

  findAllUnitsMeasure(): Observable<UnitMeasure[]> {
    return this.http.get<UnitMeasure[]>(`${this.baseUrl}/catalogs/units-measure`);
  }

  findAllCategoriesArticles(): Observable<CategoryArticle[]> {
    return this.http.get<CategoryArticle[]>(`${this.baseUrl}/catalogs/categories-articles`);
  }
}
