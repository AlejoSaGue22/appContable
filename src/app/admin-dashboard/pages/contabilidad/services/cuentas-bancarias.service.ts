import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/app/environments/environment';
import { 
  CuentaBancaria, 
  CreateCuentaBancariaDto, 
  UpdateCuentaBancariaDto, 
  Banco 
} from '../interfaces/cuenta-bancaria.interface';

@Injectable({
  providedIn: 'root'
})
export class CuentasBancariasService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}/cuentas-bancarias`;
  private readonly banksUrl = `${environment.baseUrl}/bancos`;

  getCuentas(): Observable<CuentaBancaria[]> {
    return this.http.get<CuentaBancaria[]>(this.base);
  }

  getBancos(): Observable<Banco[]> {
    return this.http.get<Banco[]>(this.banksUrl);
  }

  createCuenta(dto: CreateCuentaBancariaDto): Observable<CuentaBancaria> {
    return this.http.post<CuentaBancaria>(this.base, dto);
  }

  updateCuenta(id: string, dto: UpdateCuentaBancariaDto): Observable<CuentaBancaria> {
    return this.http.patch<CuentaBancaria>(`${this.base}/${id}`, dto);
  }

  deleteCuenta(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  toggleStatus(id: string): Observable<CuentaBancaria> {
    return this.http.patch<CuentaBancaria>(`${this.base}/toggle-status/${id}`, {});
  }
}
