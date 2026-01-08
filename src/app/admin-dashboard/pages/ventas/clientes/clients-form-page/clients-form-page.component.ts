import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { FormErrorLabelComponent } from "src/app/utils/components/form-error-label/form-error-label.component";
import { ClientesService } from '../../services/clientes.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ClientesInterface } from '@dashboard/interfaces/clientes-interface';
import { FlowbiteService } from 'src/app/utils/services/flowbite.service';
import { firstValueFrom, map, tap } from 'rxjs';
import { JsonPipe } from '@angular/common';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { LoaderComponent } from "src/app/utils/components/loader/loader.component";
import { ErrorPageComponent } from "src/app/utils/components/error-page/error-page.component";

  

@Component({
  selector: 'app-clients-form-page',
  imports: [HeaderTitlePageComponent, FormErrorLabelComponent, ReactiveFormsModule, LoaderComponent, ErrorPageComponent],
  templateUrl: './clients-form-page.component.html',
})
export class ClientsFormPageComponent implements OnInit { 
  
    private fb = inject(FormBuilder);
    clienteService = inject(ClientesService);
    router = inject(Router);
    activateRoute = inject(ActivatedRoute);
    headTitleCliente: HeaderInput = { title: 'Crear Cliente', slog: 'Registra un nuevo cliente al sistema' };

    clientsForm = this.fb.group({
        nombre: ['', Validators.required],
        apellido: ['', Validators.required],
        tipoDocumento: ['', Validators.required],
        numeroDocumento: ['', Validators.required],
        tipoPersona: ['', Validators.required],
        razonSocial: ['', Validators.required],
        direccion: ['', Validators.required],
        ciudad: ['', Validators.required],
        telefono: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(10)]],
        email: ['', Validators.required],
        observacion: [''],
        responsableFiscal: ['', Validators.required],
    })

    clienteID = toSignal(
      this.activateRoute.params.pipe(map((params) => params['id'] ))
    )

    clienteIdResource = rxResource({
      request: () => ({ id: this.clienteID() }),
      loader: ({ request }) => this.clienteService.getClientesById( request.id ).pipe(
        tap((el) => this.clientsForm.reset(el))
      )
    })

    ngOnInit() {
        this.clientsForm.get('tipoPersona')?.valueChanges.subscribe(value => {
          if(!value) return;
          this.toggleValidations(value);
        });
    }

    toggleValidations(tipo: string) {
      const nombreControl = this.clientsForm.get('nombre');
      const apellidoControl = this.clientsForm.get('apellido');
      const razonSocialControl = this.clientsForm.get('razonSocial');

      if (tipo === 'PN') {
          nombreControl?.setValidators([Validators.required]);
          apellidoControl?.setValidators([Validators.required]);
          razonSocialControl?.clearValidators();  

      } else if (tipo === 'PJ') {
          // Si el tipo es 'juridica', se requiere 'razonSocial'
          razonSocialControl?.setValidators([Validators.required]);
          nombreControl?.clearValidators(); 
          apellidoControl?.clearValidators(); 
      }

        nombreControl?.updateValueAndValidity();
        apellidoControl?.updateValueAndValidity();
        razonSocialControl?.updateValueAndValidity();
    }


    async onSubmit(){
      const isValid = this.clientsForm.valid;
      this.clientsForm.markAllAsTouched();

      if (!isValid) {
        alert("Formulario incompleto");
        return;
      }

      try {

          const formValue = {
              ...this.clientsForm.value,
              telefono: this.clientsForm.get("telefono")?.value?.toString()
          };

          if (this.clienteID() == 'new-Item') {
                const client = await firstValueFrom(this.clienteService.agregarCliente(formValue as Partial<ClientesInterface>));
          
                if (client.success == false) {
                    console.log(client.error);
                    alert(`Hubo un error al guardar el cliente ${client.error.message}`)
                    return;
                }
          
                alert("Registro exitosamente");
                await this.router.navigateByUrl('/dashboard/ventas/clients');   

          } else{
              const clientUpdate = await firstValueFrom( 
                  this.clienteService.actualizarClientes(this.clienteID(), formValue as Partial<ClientesInterface>)
              );

              if (clientUpdate.success == false) {
                  alert(`Hubo un error al guardar el cliente ${clientUpdate.error.message}`)
                  return;
              }
        
              alert("Registro Actualizado Correctamente");
              await this.router.navigateByUrl('/dashboard/ventas/clients');   
          }
        
      } catch (error: any) {
         alert(error.message)
      }
  
  }
  
  async onCancel(){
      this.clientsForm.reset();
      await this.router.navigateByUrl('/dashboard/ventas/clients');   
 }


}
