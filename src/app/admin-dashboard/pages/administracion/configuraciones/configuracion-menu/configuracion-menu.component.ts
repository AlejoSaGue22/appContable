import { Component, signal, inject } from '@angular/core';
import {
  HeaderTitlePageComponent,
  HeaderInput,
} from '../../../../components/header-title-page/header-title-page.component';
import { RouterLink } from '@angular/router';
import { AuthService } from 'src/app/auth/services/auth.service';
import { HelpersUtils } from '@utils/helpers.utils';

@Component({
  selector: 'app-configuracion-menu',
  imports: [HeaderTitlePageComponent, RouterLink],
  templateUrl: './configuracion-menu.component.html',
  standalone: true,
})
export class ConfiguracionMenuComponent {
  private authService = inject(AuthService);

  user = this.authService.user;
  logoApp = HelpersUtils.logoApp;
  nameApp = HelpersUtils.nameApp;

  headTitle = signal<HeaderInput>({
    title: 'Configuración',
    slog: 'Administra y personaliza los parámetros globales de tu sistema',
  });

  menuSections = [
    {
      title: 'Empresa',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      description:
        'Configura la información de tu empresa y adapta el sistema a tu negocio.',
      options: [
        { label: 'Datos de Empresa', route: 'empresa' },
        // { label: 'Usuarios y Permisos', route: 'usuarios' },
        // { label: 'Mi perfil', route: 'perfil' },
        { label: 'Centros de costos', route: 'centros-costos' },
        { label: 'Cargos', route: 'cargos' },
      ],
    },
    {
      title: 'Facturación',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      description: 'Configura la información que se mostrará en tus facturas y procesos de venta.',
      options: [
        // { label: 'Términos de pago', route: 'terminos-pago' },
        // { label: 'Numeraciones', route: 'numeraciones' },
        // { label: 'Configuración de documentos', route: 'config-documentos' },
        { label: 'Vendedores', route: 'vendedores' },
        // { label: 'Propinas', route: 'propinas' },
      ],
    },
    {
      title: 'Plantillas de impresión',
      icon: 'M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z',
      description: 'Administra los diseños y formatos de impresión de tus documentos.',
      options: [
        { label: 'Plantillas de Factura', route: 'plantillas' },
        { label: 'Formatos de Comprobante', route: 'formatos' },
      ],
    },
    {
      title: 'Impuestos',
      icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      description: 'Define aquí los tipos de impuestos y retenciones que aplicas a tus facturas.',
      options: [
        { label: 'Impuestos (IVA/ICO)', route: 'impuestos' },
        { label: 'Retenciones', route: 'retenciones' },
        // { label: 'Configuración avanzada', route: 'config-avanzada-impuestos' },
      ],
    },
    {
      title: 'Contabilidad',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      description: 'Define opciones avanzadas para el manejo de tu contabilidad.',
      options: [
        // { label: 'Actualizar registros contables', route: 'actualizar-registros' },
        {
          label: 'Parametrización contable',
          route: 'parametrizacion-contable',
        },
        // { label: 'Cierre contable de resultados', route: 'cierre-contable' },
        // { label: 'Configurar información exógena', route: 'exogena' },
        { label: 'Tipos de Comprobantes', route: 'tipos-comprobantes' },
        // { label: 'Numeraciones contables', route: 'numeraciones-contables' },
      ],
    },
    {
      title: 'Notificaciones y correos',
      icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      description: 'Configura las plantillas, las notificaciones del sistema y las de facturas.',
      options: [
        { label: 'Notificaciones de cobro', route: 'notificaciones-cobro' },
        { label: 'Plantillas de correos y WhatsApp', route: 'plantillas-comunicacion' },
        { label: 'Preferencias de correo', route: 'preferencias-correo' },
      ],
    },
    // {
    // title: 'Inventario',
    // icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    // description: 'Define opciones avanzadas para la creación, venta y gestión de tus productos.',
    // options: [
    // { label: 'Campos adicionales', route: 'campos-adicionales' },
    // { label: 'Variantes de producto', route: 'variantes' },
    // ]
    // },
    // {
    // title: 'Integraciones',
    // icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 00-1 1v1a2 2 0 11-4 0v-1a1 1 0 00-1-1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z',
    // description: 'Encuentra toda la información para que puedas integrar otros sistemas.',
    // options: [
    // { label: 'API / Webhooks', route: 'api-webhooks' },
    // { label: 'Marketplace de Apps', route: 'marketplace' },
    // ]
    // }
  ];
}
