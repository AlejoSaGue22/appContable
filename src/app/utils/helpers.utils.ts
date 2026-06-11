export class HelpersUtils {

  static readonly nameApp = 'ALVA SOFT';
  static readonly logoApp = 'assets/images/logo_app.png';
  static readonly slogan = 'Software Contable, Administradora y Comercial';

  static getMessageError(error: string[]): string {

    if (typeof error === 'string') {
      return error;
    }

    if (error.length > 0) {
      return error.join(', ');
    }
    return 'Error desconocido';
  }
}   