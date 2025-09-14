import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { FormErrorLabelComponent } from "@shared/components/form-error-label/form-error-label.component";

@Component({
  selector: 'app-clients-form-page',
  imports: [HeaderTitlePageComponent, FormErrorLabelComponent, ReactiveFormsModule],
  templateUrl: './clients-form-page.component.html',
})
export class ClientsFormPageComponent { 

  private fb = inject(FormBuilder);

  headTitleCliente: HeaderInput = {
    title: 'Crear Cliente',
    slog: 'Registra un nuevo cliente al sistema'
  }

  clientsForm = this.fb.group({
      nombre: ['', Validators.required],
      apellido: ['', Validators.required],
      tipoDocumento: ['', Validators.required],
      numeroDocumento: ['', Validators.required],
      tipo: ['', Validators.required],
      razonSocial: ['', Validators.required],
      direccion: ['', Validators.required],
      ciudad: ['', Validators.required],
      telefono: ['', Validators.required, Validators.min(1), Validators.maxLength(10)],
      condicionIva: ['', Validators.required],
  })


  async onSubmit(){
      const isValid = this.clientsForm.valid;

      console.log("JJ")

      this.clientsForm.markAllAsTouched();

      
  }
}
