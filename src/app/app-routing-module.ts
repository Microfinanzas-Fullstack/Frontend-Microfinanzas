import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

/**
 * Configuración de rutas de la aplicación
 * 
 * Estructura:
 * - /auth/* - Rutas públicas de autenticación (login, register)
 * - /dashboard - Ruta protegida del dashboard principal
 * - /transactions - Ruta protegida de gestión de transacciones (lazy loaded)
 * - /subscriptions - Ruta protegida de gestión de suscripciones (lazy loaded)
 * - '' - Redirección por defecto a /dashboard
 * - '**' - Wildcard para rutas no encontradas (404)
 * 
 * Rutas protegidas usan AuthGuard para verificar autenticación
 * Rutas lazy-loaded se cargan solo cuando el usuario las visita
 */
const routes: Routes = [
  // Redirección raíz a dashboard
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },

  // Rutas de autenticación (públicas)
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component')
          .then(m => m.LoginComponent),
        title: 'Iniciar Sesión'
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component')
          .then(m => m.RegisterComponent),
        title: 'Registro'
      },
      // Redirección por defecto a login
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },

  // Dashboard (ruta protegida)
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    canActivate: [AuthGuard],
    title: 'Dashboard'
  },

  // Transacciones (ruta protegida, lazy loaded)
  {
    path: 'transactions',
    loadChildren: () => import('./features/transactions/transactions-routing.module')
      .then(m => m.TransactionsRoutingModule),
    canActivate: [AuthGuard],
    title: 'Transacciones'
  },

  // Suscripciones (ruta protegida, lazy loaded)
  // {
  //   path: 'subscriptions',
  //   loadChildren: () => import('./features/subscriptions/subscriptions.module')
  //     .then(m => m.SubscriptionsModule),
  //   canActivate: [AuthGuard],
  //   title: 'Suscripciones'
  // },

  // Ruta wildcard para 404 (siempre debe ser la última)
  {
    path: '**',
    redirectTo: '/dashboard'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    // Habilitar estrategia de precarga de módulos lazy-loaded
    // preloadingStrategy: PreloadAllModules,

    // Scroll al inicio al cambiar de ruta
    scrollPositionRestoration: 'top',

    // Habilitar hash location strategy si es necesario
    // useHash: true
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
