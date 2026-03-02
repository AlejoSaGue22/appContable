export class HelpersUtils {

  static readonly nameApp = 'ASG Contanova';
  static readonly logoApp = 'assets/images/logo_app.png';

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