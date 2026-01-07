import { NgModule, provideBrowserGlobalErrorListeners } from '@angular/core';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors, HTTP_INTERCEPTORS } from '@angular/common/http';

// Routing
import { AppRoutingModule } from './app-routing-module';

// Componente raíz
import { App } from './app';

// Interceptores
import { JwtInterceptor } from './core/interceptors/jwt.interceptor';

// Guards
import { AuthGuard } from './core/guards/auth.guard';

// Servicios (providedIn: 'root' - no necesitan declaración aquí)
// - AuthService
// - TransactionService
// - SubscriptionService

// Chart.js - Registrar componentes necesarios
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';

/**
 * Módulo principal de la aplicación
 * 
 * Configuraciones incluidas:
 * - BrowserModule: Funcionalidad básica de navegador
 * - BrowserAnimationsModule: Animaciones para Angular Material
 * - HttpClient: Cliente HTTP con interceptor JWT
 * - AppRoutingModule: Configuración de rutas
 * - Chart.js: Librería de gráficos con componentes por defecto
 * 
 * Interceptores:
 * - JwtInterceptor: Adjunta token JWT a peticiones HTTP
 * 
 * Guards:
 * - AuthGuard: Protege rutas que requieren autenticación
 */
@NgModule({
  declarations: [
    App  // Componente raíz de la aplicación
  ],
  imports: [
    BrowserModule,              // Funcionalidad básica del navegador
    BrowserAnimationsModule,    // Requerido para Angular Material
    AppRoutingModule            // Configuración de rutas
  ],
  providers: [
    // Manejo global de errores
    provideBrowserGlobalErrorListeners(),
    
    // Client-side hydration para SSR
    provideClientHydration(withEventReplay()),
    
    // Configurar HttpClient con interceptor JWT
    provideHttpClient(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true  // Permite múltiples interceptores
    },
    
    // Proveedor de Chart.js con configuración por defecto
    provideCharts(withDefaultRegisterables()),
    
    // Guards (ya están providedIn: 'root', pero se pueden listar aquí para claridad)
    AuthGuard
  ],
  bootstrap: [App]  // Componente de arranque
})
export class AppModule { }
