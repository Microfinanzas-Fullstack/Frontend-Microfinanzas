import { Injectable } from '@angular/core';
import { 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpInterceptor,
  HttpErrorResponse 
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

/**
 * Interceptor HTTP para adjuntar el token JWT a todas las peticiones
 * 
 * Responsabilidades:
 * - Interceptar todas las peticiones HTTP salientes
 * - Adjuntar el token JWT en el header 'Authorization' si existe
 * - Manejar errores 401 (No autorizado) cerrando sesión automáticamente
 * - Excluir endpoints públicos que no requieren autenticación
 * 
 * Uso:
 * Se registra en app.module.ts con:
 * providers: [
 *   { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true }
 * ]
 */
@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  
  /**
   * URLs públicas que NO requieren token JWT
   * Ajustar según los endpoints del backend
   */
  private readonly PUBLIC_URLS = [
    '/api/auth/login',
    '/api/auth/register'
  ];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Intercepta todas las peticiones HTTP
   * 
   * @param request - Petición HTTP original
   * @param next - Handler para continuar con la petición
   * @returns Observable con la respuesta HTTP
   */
  intercept(
    request: HttpRequest<unknown>, 
    next: HttpHandler
  ): Observable<HttpEvent<unknown>> {
    
    // Verificar si la URL es pública (no requiere token)
    const isPublicUrl = this.isPublicUrl(request.url);
    
    // Obtener token actual
    const token = this.authService.getToken();

    // Si la URL NO es pública y existe un token, adjuntarlo
    if (!isPublicUrl && token) {
      // Clonar la petición y añadir el header Authorization
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    // Continuar con la petición y manejar errores
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        
        // Si el error es 401 Unauthorized, cerrar sesión
        if (error.status === 401) {
          console.warn('Token inválido o expirado. Cerrando sesión...');
          this.authService.logout();
          this.router.navigate(['/auth/login']);
        }

        // Si el error es 403 Forbidden, mostrar mensaje
        if (error.status === 403) {
          console.error('Acceso prohibido: No tienes permisos para esta acción');
        }

        // Propagar el error para que los servicios puedan manejarlo
        return throwError(() => error);
      })
    );
  }

  /**
   * Verifica si una URL es pública (no requiere autenticación)
   * 
   * @param url - URL de la petición
   * @returns true si la URL es pública
   */
  private isPublicUrl(url: string): boolean {
    return this.PUBLIC_URLS.some(publicUrl => url.includes(publicUrl));
  }
}
