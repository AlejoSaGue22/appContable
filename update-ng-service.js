const fs = require('fs');
const path = 'C:\\laragon\\www\\Course_Angular_2025\\Contable\\appContable\\src\\app\\admin-dashboard\\pages\\nomina\\services\\nomina.service.ts';
let c = fs.readFileSync(path, 'utf8');

const importReplacement = PeriodoEmpleadoConcepto, ConceptosConsolidadosResponse, ObligacionNomina, PagarObligacionesDto\n} from '../interfaces/nomina.interface';;
c = c.replace("PeriodoEmpleadoConcepto, ConceptosConsolidadosResponse\n} from '../interfaces/nomina.interface';", importReplacement);

const newMethods = 
  getObligaciones(filters?: any): Observable<ObligacionNomina[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }
    return this.http.get<ObligacionNomina[]>(this.apiUrl + '/obligaciones', { params }).pipe(
      catchError(this.handleError)
    );
  }

  pagarObligaciones(periodoId: string, dto: PagarObligacionesDto): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/periodos/' + periodoId + '/pagar', dto).pipe(
      catchError(this.handleError)
    );
  }

  // Métodos de Periodos
;

c = c.replace("  // Métodos de Periodos", newMethods);
fs.writeFileSync(path, c, 'utf8');
