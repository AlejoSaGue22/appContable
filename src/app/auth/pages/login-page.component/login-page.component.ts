import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from "@angular/router";
import { AuthService } from '../../services/auth.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LoaderService } from 'src/app/utils/services/loader.service';
import { FormErrorLabelComponent } from "src/app/utils/components/form-error-label/form-error-label.component";

@Component({
  selector: 'app-login-page.component',
  imports: [RouterLink, ReactiveFormsModule, FormErrorLabelComponent],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {

    private fb = inject(FormBuilder);
    authService = inject(AuthService);
    loader = inject(LoaderService);
    router = inject(Router);

    private _isLoading = signal<boolean>(false);
    isLoading = computed(() => this._isLoading());

    formLogin = this.fb.group({
      email: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    })

    async onSubmit(){
        const valid = this.formLogin.valid;
        this.formLogin.markAllAsTouched();

        if (!valid) {
          alert('Formulario Invalido');
          return
        }
        
        this.loader.show();
        
        const { email, password } = this.formLogin.value;

        this.authService.login(email!, password!).subscribe(async (isAuthenticaded) => {
            if (isAuthenticaded.success == true) {
              await this.router.navigateByUrl('/dashboard/index');
              this.loader.hide();
              return;
            }
                
            this.loader.hide();
            alert(isAuthenticaded.error.message)
        })
    }

}
