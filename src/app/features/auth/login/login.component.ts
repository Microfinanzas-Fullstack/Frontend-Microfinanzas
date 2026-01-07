import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/services/auth.service';
import { LoginDTO } from '../../../core/models';

/**
 * Componente de Login
 * 
 * Responsabilidades:
 * - Renderizar formulario de inicio de sesión
 * - Validar credenciales del usuario
 * - Consumir AuthService para autenticación
 * - Redirigir al dashboard tras login exitoso
 * - Manejar errores de autenticación
 */
@Component({
  selector: 'app-login',
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
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  /**
   * Formulario reactivo de login
   * Contiene controles para email y password con validaciones
   */
  loginForm!: FormGroup;

  /**
   * Indica si se está procesando el login
   * Se usa para mostrar spinner y deshabilitar el botón
   */
  isLoading = false;

  /**
   * Mensaje de error a mostrar al usuario
   * null cuando no hay error
   */
  errorMessage: string | null = null;

  /**
   * Controla la visibilidad de la contraseña
   * true = texto visible, false = password oculto
   */
  hidePassword = true;

  /**
   * URL a la que redirigir tras login exitoso
   * Se obtiene de query params o default a /dashboard
   */
  private returnUrl = '/dashboard';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  /**
   * Inicialización del componente
   * - Crea el formulario reactivo
   * - Obtiene la returnUrl de los query params
   * - Redirige a dashboard si ya está autenticado
   */
  ngOnInit(): void {
    // Crear formulario con validaciones
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });

    // Obtener returnUrl de query params (si existe)
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';

    // Si ya está autenticado, redirigir al dashboard
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.returnUrl]);
    }
  }

  /**
   * Maneja el envío del formulario de login
   * 
   * Flujo:
   * 1. Validar que el formulario sea válido
   * 2. Activar spinner y limpiar errores
   * 3. Llamar a authService.login()
   * 4. En caso de éxito: redirigir a returnUrl
   * 5. En caso de error: mostrar mensaje de error
   */
  onSubmit(): void {
    // Validar formulario
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    // Preparar datos para enviar
    const credentials: LoginDTO = {
      email: this.loginForm.value.email,
      password: this.loginForm.value.password
    };

    // Activar estado de carga
    this.isLoading = true;
    this.errorMessage = null;

    // Llamar al servicio de autenticación
    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('Login exitoso:', response.email);
        
        // Redirigir a la URL solicitada o al dashboard
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        console.error('Error en login:', error);
        
        // Manejar diferentes tipos de errores
        if (error.status === 401) {
          this.errorMessage = 'Email o contraseña incorrectos';
        } else if (error.status === 0) {
          this.errorMessage = 'No se puede conectar al servidor. Verifica tu conexión.';
        } else {
          this.errorMessage = 'Error al iniciar sesión. Intenta nuevamente.';
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
   * Obtiene el mensaje de error para el campo email
   * Se usa en el template para mostrar errores de validación
   */
  getEmailErrorMessage(): string {
    const emailControl = this.loginForm.get('email');
    if (emailControl?.hasError('required')) {
      return 'El email es requerido';
    }
    if (emailControl?.hasError('email')) {
      return 'Email inválido';
    }
    return '';
  }

  /**
   * Obtiene el mensaje de error para el campo password
   * Se usa en el template para mostrar errores de validación
   */
  getPasswordErrorMessage(): string {
    const passwordControl = this.loginForm.get('password');
    if (passwordControl?.hasError('required')) {
      return 'La contraseña es requerida';
    }
    if (passwordControl?.hasError('minlength')) {
      return 'La contraseña debe tener al menos 8 caracteres';
    }
    return '';
  }
}
