import { ValidationErrors } from "@angular/forms";

export class FormUtils {

    // Expresiones regulares
  static namePattern = '([a-zA-Z]+) ([a-zA-Z]+)';
  static emailPattern = '^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,4}$';
  static notOnlySpacesPattern = '^[a-zA-Z0-9]+$';
  static slugPattern = '^[a-z0-9_]+(?:-[a-z0-9_]+)*$';

  static getTextError(errors: ValidationErrors){
        for (const key of Object.keys(errors)) {
                switch (key) {
                    case 'required':
                        return 'Este campo es requerido';
                    
                    case 'minlength':
                        return 'Este campo es requerido';

                    case 'minlength':
                        return `Mínimo de ${errors['minlength'].requiredLength} caracteres.`;

                    case 'min':
                        return `Valor mínimo de ${errors['min'].min}`;

                    case 'email':
                        return `El valor ingresado no es un correo electrónico`;
                    
                    case 'emailTaken':
                        return `El correo electrónico ya está siendo usado por otro usuario`;

                    case 'pattern':
                        return 'Error de escritura en el campo';

                    default:
                        return `Error de validación no controlado ${key}`;
                }
        }

        return null;
  }


}   