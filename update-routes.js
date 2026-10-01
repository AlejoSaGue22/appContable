const fs = require('fs');
const path = 'C:\\laragon\\www\\Course_Angular_2025\\Contable\\appContable\\src\\app\\admin-dashboard\\pages\\nomina\\nomina.routes.ts';
let c = fs.readFileSync(path, 'utf8');

const tesoreriaRoute = 
    {
        path: 'tesoreria',
        loadComponent: () => import('./tesoreria/tesoreria-page.component')
    },
    {
        path: '**',;
c = c.replace(/\{\s*path: '\*\*',/g, tesoreriaRoute);
fs.writeFileSync(path, c, 'utf8');
