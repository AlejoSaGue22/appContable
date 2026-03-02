import { Component, inject } from '@angular/core';
import { Router, RouterLink } from "@angular/router";
import { AuthService } from '../../services/auth.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificationService } from '@shared/services/notification.service';

@Component({
  selector: 'app-register-page.component',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './register-page.component.html',
})
export class RegisterPageComponent {

  private authService = inject(AuthService);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);

  registerForm = this.fb.group({
    fullname: ['', Validators.required],
    lastname: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  onSubmit() {
    const valid = this.registerForm.valid;
    const { fullname, lastname, email, password } = this.registerForm.value;
    this.registerForm.markAllAsTouched();
    if (!valid) {
      this.notificationService.error(
        'Por favor, completa los campos requeridos.',
        'Campos no validos',
        5000
      );
      return;
    }
    
    const fullName = `${fullname} ${lastname}`; 
    this.authService.register(fullName, email!, password!).subscribe({
      next: () => {
        this.router.navigate(['/panel/dashboard']);
        this.notificationService.success('Usuario registrado exitosamente');
      },
      error: (error) => {
        this.notificationService.error(error.error.message);
      }
    });
  }
 }
