import { Component, inject, OnInit, signal, input, output } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HeaderInput, HeaderTitlePageComponent } from "@dashboard/components/header-title-page/header-title-page.component";
import { FormErrorLabelComponent } from "src/app/utils/components/form-error-label/form-error-label.component";
import { NotificationService } from '@shared/services/notification.service';
import { LoaderService } from '@utils/services/loader.service';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map, of, tap } from 'rxjs';
import { User, Role, CreateUserDto, UpdateUserDto } from 'src/app/admin-dashboard/interfaces/users-interface';
import { UsersService } from '../services/users.service';
import { LoaderComponent } from "@utils/components/loader/loader.component";

@Component({
    selector: 'app-user-forms-page',
    imports: [CommonModule, ReactiveFormsModule, HeaderTitlePageComponent, FormErrorLabelComponent, LoaderComponent],
    templateUrl: './user-forms-page.component.html',
    standalone: true
})
export class UserFormsPageComponent implements OnInit {

    isModal = input<boolean>(false);
    saveSuccess = output<User>();
    cancel = output<void>();

    headTitle: HeaderInput = {
        title: 'Gestión de Usuario',
        slog: 'Registra o actualiza la información de los usuarios del sistema'
    }

    private fb = inject(FormBuilder);
    notificationService = inject(NotificationService);
    loaderService = inject(LoaderService);
    router = inject(Router);
    activatedRoute = inject(ActivatedRoute);
    private usersService = inject(UsersService);

    roles = signal<Role[]>([]);
    loading = signal<boolean>(false);

    userId = toSignal(
        this.activatedRoute.params.pipe(
            map((param) => param['id'])
        )
    );

    formUser = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        role: ['', Validators.required],
        phone: [''],
        isActive: [true]
    });

    ngOnInit(): void {
        this.loadRoles();

        if (this.userId() && this.userId() !== 'new-Item') {
            this.headTitle.title = 'Editar Usuario';
            this.formUser.get('password')?.clearValidators();
            this.formUser.get('password')?.updateValueAndValidity();
        } else {
            this.headTitle.title = 'Nuevo Usuario';
        }

        if (this.isModal()) {
            this.formUser.reset({ isActive: true });
        }
    }

    async loadRoles() {
        try {
            const roles = await firstValueFrom(this.usersService.getRoles());
            this.roles.set(roles);
        } catch (error) {
            this.notificationService.error('Error al cargar roles', 'Error');
        }
    }

    userResource = rxResource({
        request: () => {
            if (this.isModal() || !this.userId() || this.userId() === 'new-Item') return null;
            return { id: this.userId() }
        },
        loader: ({ request }) => {
            if (!request) return of(null);
            return this.usersService.getUsersById(request.id).pipe(
                tap((user) => this.patchForm(user))
            )
        }
    })

    patchForm(user: User) {
        this.loaderService.show();

        // Split fullName into firstName and lastName (simple split)
        const names = user.fullName.split(' ');
        const firstName = names[0] || '';
        const lastName = names.slice(1).join(' ') || '';

        this.formUser.patchValue({
            email: user.email,
            firstName: firstName,
            lastName: lastName,
            role: user.roleId,
            phone: user.phone || '',
            isActive: user.isActive
        });
        this.loaderService.hide();
    }

    async onSubmit() {
        if (this.formUser.invalid) {
            this.formUser.markAllAsTouched();
            this.notificationService.error('Por favor revise los campos obligatorios', 'Formulario Inválido');
            return;
        }

        this.loaderService.show();

        try {
            const formValue = this.formUser.value;

            if (this.userId() === 'new-Item' || this.isModal()) {
                const result = await firstValueFrom(this.usersService.createUser(formValue as CreateUserDto));

                this.loaderService.hide();
                if (!result.success) {
                    this.notificationService.error(`Error al crear usuario: ${result.error?.message}`, 'Error');
                    return;
                }

                this.notificationService.success("Usuario creado exitosamente", 'Éxito');

                if (this.isModal()) {
                    this.saveSuccess.emit(result.data);
                } else {
                    await this.router.navigateByUrl('/panel/admin/users');
                }

            } else {
                const updateDto: UpdateUserDto = {
                    email: formValue.email!,
                    firstName: formValue.firstName!,
                    lastName: formValue.lastName!,
                    role: formValue.role!,
                    phone: formValue.phone!,
                    isActive: formValue.isActive!
                };

                const result = await firstValueFrom(this.usersService.updateUser(this.userId()!, updateDto));

                this.loaderService.hide();
                if (!result.success) {
                    this.notificationService.error(`Error al actualizar usuario: ${result.error?.message}`, 'Error');
                    return;
                }

                this.notificationService.success("Usuario actualizado exitosamente", 'Éxito');
                await this.router.navigateByUrl('/panel/admin/users');
            }

        } catch (error: any) {
            this.loaderService.hide();
            this.notificationService.error(error.message, 'Error');
        }
    }

    onCancel() {
        if (this.isModal()) {
            this.cancel.emit();
        } else {
            this.router.navigate(['/panel/admin/users']);
        }
    }
}
