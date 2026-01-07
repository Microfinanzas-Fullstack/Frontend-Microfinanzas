import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/services/auth.service';
import { CreateUserDTO } from '../../../core/models';

/**
 * Componente de Registro
 * 
 * Responsabilidades:
 * - Renderizar formulario de registro de usuario
 * - Validar datos del nuevo usuario
 * - Consumir AuthService para crear cuenta
 * - Redirigir al dashboard tras registro exitoso
 * - Validar que las contraseñas coincidan
 */
@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  /**
   * Formulario reactivo de registro
   * Contiene controles para fullName, email, password y confirmPassword
   */
  registerForm!: FormGroup;

  /**
   * Indica si se está procesando el registro
   */
  isLoading = false;

  /**
   * Mensaje de error a mostrar al usuario
   */
  errorMessage: string | null = null;

  /**
   * Controla la visibilidad de la contraseña
   */
  hidePassword = true;

  /**
   * Controla la visibilidad de la confirmación de contraseña
   */
  hideConfirmPassword = true;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Inicialización del componente
   * - Crea el formulario reactivo con validaciones
   * - Redirige a dashboard si ya está autenticado
   */
  ngOnInit(): void {
    // Crear formulario con validaciones
    this.registerForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      // Validador personalizado para verificar que las contraseñas coincidan
      validators: this.passwordMatchValidator
    });

    // Si ya está autenticado, redirigir al dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Validador personalizado para verificar que las contraseñas coincidan
   * 
   * @param formGroup - FormGroup a validar
   * @returns null si las contraseñas coinciden, objeto con error si no
   */
  private passwordMatchValidator(formGroup: FormGroup): { [key: string]: boolean } | null {
    const password = formGroup.get('password')?.value;
    const confirmPassword = formGroup.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      return { passwordMismatch: true };
    }

    return null;
  }

  /**
   * Maneja el envío del formulario de registro
   * 
   * Flujo:
   * 1. Validar que el formulario sea válido
   * 2. Verificar que las contraseñas coincidan
   * 3. Activar spinner y limpiar errores
   * 4. Llamar a authService.register()
   * 5. En caso de éxito: redirigir al dashboard
   * 6. En caso de error: mostrar mensaje de error
   */
  onSubmit(): void {
    // Validar formulario
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    // Verificar que las contraseñas coincidan
    if (this.registerForm.hasError('passwordMismatch')) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    // Preparar datos para enviar
    const userData: CreateUserDTO = {
      fullName: this.registerForm.value.fullName,
      email: this.registerForm.value.email,
      password: this.registerForm.value.password
    };

    // Activar estado de carga
    this.isLoading = true;
    this.errorMessage = null;

    // Llamar al servicio de autenticación
    this.authService.register(userData).subscribe({
      next: (response) => {
        console.log('Registro exitoso:', response.email);
        
        // Redirigir al dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Error en registro:', error);
        
        // Manejar diferentes tipos de errores
        if (error.status === 409) {
          this.errorMessage = 'Este email ya está registrado';
        } else if (error.status === 400) {
          this.errorMessage = 'Datos inválidos. Verifica la información.';
        } else if (error.status === 0) {
          this.errorMessage = 'No se puede conectar al servidor. Verifica tu conexión.';
        } else {
          this.errorMessage = 'Error al registrarse. Intenta nuevamente.';
        }
        
        this.isLoading = false;
      }
    });
  }

  /**
   * Alterna la visibilidad de la contraseña
   */
  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  /**
   * Alterna la visibilidad de la confirmación de contraseña
   */
  toggleConfirmPasswordVisibility(): void {
    this.hideConfirmPassword = !this.hideConfirmPassword;
  }

  /**
   * Obtiene el mensaje de error para el campo fullName
   */
  getFullNameErrorMessage(): string {
    const control = this.registerForm.get('fullName');
    if (control?.hasError('required')) {
      return 'El nombre completo es requerido';
    }
    if (control?.hasError('minlength')) {
      return 'El nombre debe tener al menos 3 caracteres';
    }
    return '';
  }

  /**
   * Obtiene el mensaje de error para el campo email
   */
  getEmailErrorMessage(): string {
    const control = this.registerForm.get('email');
    if (control?.hasError('required')) {
      return 'El email es requerido';
    }
    if (control?.hasError('email')) {
      return 'Email inválido';
    }
    return '';
  }

  /**
   * Obtiene el mensaje de error para el campo password
   */
  getPasswordErrorMessage(): string {
    const control = this.registerForm.get('password');
    if (control?.hasError('required')) {
      return 'La contraseña es requerida';
    }
    if (control?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    return '';
  }

  /**
   * Obtiene el mensaje de error para el campo confirmPassword
   */
  getConfirmPasswordErrorMessage(): string {
    const control = this.registerForm.get('confirmPassword');
    if (control?.hasError('required')) {
      return 'Debes confirmar la contraseña';
    }
    if (this.registerForm.hasError('passwordMismatch')) {
      return 'Las contraseñas no coinciden';
    }
    return '';
  }
}
