import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from 'src/app/environments/environment';
import { 
  CuentaBancaria, 
  CreateCuentaBancariaDto, 
  UpdateCuentaBancariaDto, 
  Banco, 
  ResponseCuentasBancarias,
  ResponseBancos
} from '../interfaces/cuenta-bancaria.interface';

@Injectable({
  providedIn: 'root'
})
export class CuentasBancariasService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.baseUrl}/cuentas-bancarias`;
  private readonly banksUrl = `${environment.baseUrl}/bancos`;

  getCuentas(): Observable<ResponseCuentasBancarias> {
    return this.http.get<ResponseCuentasBancarias>(this.base).pipe(
      map((response) => {
        response.data.sort((a, b) => a.banco.nombre.localeCompare(b.banco.nombre));
        return response;
      })
    );
  }

  getBancos(): Observable<ResponseBancos> {
    return this.http.get<ResponseBancos>(this.banksUrl);
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
