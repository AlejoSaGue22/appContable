export class HelpersUtils {

  static getMessageError(error: string[]): string {
    if (error.length > 0) {
      return error.join(', ');
    }
    return 'Error desconocido';
  }


}   