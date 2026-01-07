import { Injectable } from '@angular/core';
import { 
  CanActivate, 
  ActivatedRouteSnapshot, 
  RouterStateSnapshot, 
  Router,
  UrlTree 
} from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Guard de autenticación para proteger rutas
 * 
 * Responsabilidades:
 * - Verificar si el usuario está autenticado antes de acceder a una ruta
 * - Redirigir a /auth/login si no está autenticado
 * - Permitir acceso si el token JWT es válido
 * 
 * Uso en routing:
 * {
 *   path: 'dashboard',
 *   component: DashboardComponent,
 *   canActivate: [AuthGuard]  // Protege esta ruta
 * }
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Determina si una ruta puede ser activada
   * 
   * @param route - Información de la ruta que se intenta activar
   * @param state - Estado actual del router
   * @returns true si el usuario está autenticado, UrlTree para redireccionar si no
   * 
   * Flujo:
   * 1. Verificar si el usuario está autenticado (token válido)
   * 2. Si está autenticado: permitir acceso (return true)
   * 3. Si NO está autenticado: redirigir a login y preservar la URL solicitada
   */
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
    
    // Verificar si el usuario está autenticado
    if (this.authService.isAuthenticated()) {
      // Usuario autenticado: permitir acceso
      return true;
    }

    // Usuario NO autenticado: redirigir a login
    console.warn('Acceso denegado. Redirigiendo a login...');
    
    /**
     * Redirigir a login preservando la URL solicitada
     * Esto permite redirigir al usuario a su destino original tras login exitoso
     * 
     * Ejemplo: Si intenta acceder a /dashboard, tras login será redirigido a /dashboard
     */
    return this.router.createUrlTree(['/auth/login'], {
      queryParams: { returnUrl: state.url }
    });
  }
}
