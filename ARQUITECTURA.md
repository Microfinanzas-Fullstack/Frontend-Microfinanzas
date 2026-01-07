# Dashboard de Finanzas Personales - Angular

## 📋 Descripción del Proyecto

Aplicación web de gestión de finanzas personales desarrollada con Angular 21, que permite a los usuarios realizar seguimiento de sus ingresos, gastos y suscripciones. El proyecto implementa una arquitectura modular siguiendo las mejores prácticas de Angular con autenticación JWT.

## 🏗️ Arquitectura del Proyecto

### Estructura Modular

```
src/app/
├── core/                    # Módulo Core - Servicios y funcionalidades centrales
│   ├── guards/             
│   │   └── auth.guard.ts          # Guard para proteger rutas
│   ├── interceptors/
│   │   └── jwt.interceptor.ts     # Interceptor para adjuntar JWT a peticiones
│   ├── models/                    # Interfaces y modelos TypeScript
│   │   ├── enums.ts              # Enumeraciones del dominio
│   │   ├── transaction.model.ts   # Modelos de transacciones
│   │   ├── subscription.model.ts  # Modelos de suscripciones
│   │   ├── user.model.ts         # Modelos de usuario y autenticación
│   │   └── index.ts              # Barrel file para exportaciones
│   └── services/                  # Servicios con BehaviorSubject
│       ├── auth.service.ts        # Autenticación y gestión de JWT
│       ├── transaction.service.ts # CRUD de transacciones
│       └── subscription.service.ts # CRUD de suscripciones
│
├── shared/                  # Módulo Shared - Componentes reutilizables
│   ├── components/         # Componentes compartidos
│   └── pipes/              # Pipes personalizados
│
└── features/               # Módulos de características
    ├── auth/
    │   ├── login/         # Componente de inicio de sesión
    │   └── register/      # Componente de registro
    ├── dashboard/         # Dashboard con resumen financiero
    ├── transactions/      # Gestión de transacciones
    └── subscriptions/     # Gestión de suscripciones
```

## 🔑 Características Principales

### 1. Autenticación JWT
- **AuthService**: Gestión completa de autenticación con BehaviorSubject
- **JwtInterceptor**: Intercepta todas las peticiones HTTP y adjunta el token JWT automáticamente
- **AuthGuard**: Protege rutas que requieren autenticación
- **Token Storage**: Almacenamiento seguro en localStorage con validación de expiración

### 2. Dashboard Reactivo
- **Signals de Angular**: Uso de `signal()` y `computed()` para estado reactivo
- **Cards de resumen**: Visualización de ingresos, gastos, balance y suscripciones
- **Gráfico de pastel**: Distribución de gastos por categoría con ng2-charts
- **Estadísticas adicionales**: Promedio de gastos y análisis de categorías

### 3. Gestión de Estado con BehaviorSubject
- **TransactionService**: Mantiene estado de transacciones con BehaviorSubject
- **SubscriptionService**: Mantiene estado de suscripciones con BehaviorSubject
- **Actualizaciones reactivas**: Los componentes se suscriben y reciben actualizaciones automáticas

### 4. Interfaces TypeScript alineadas con el Backend

Las interfaces están diseñadas para coincidir exactamente con los DTOs del backend Java DDD:

#### Transacciones
```typescript
// Frontend: CreateTransactionDTO
interface CreateTransactionDTO {
  amount: number;
  currency: string;
  type: TransactionType;  // INCOME | EXPENSE
  category: string;
  description?: string;
  transactionDate: string;
}

// Backend: com.silva.microfinanzas.application.dtos.CreateTransactionDTO
```

#### Suscripciones
```typescript
// Frontend: SubscriptionDTO
interface SubscriptionDTO {
  id: string;
  name: string;
  amount: number;
  currency: string;
  billingCycleDays: number;
  status: SubscriptionStatus;  // ACTIVE | PAUSED | CANCELLED
  nextBillingDate: string;
}

// Backend: com.silva.microfinanzas.application.dtos.SubscriptionDTO
```

#### Autenticación
```typescript
// Frontend: JwtResponseDTO
interface JwtResponseDTO {
  token: string;
  refreshToken: string;
  type: string;
  email: string;
  roles: UserRole[];  // USER | ADMIN
}

// Backend: com.silva.microfinanzas.application.dtos.JwtResponseDTO
```

## 🎨 Stack Tecnológico

### Frontend
- **Angular 21**: Framework principal
- **TypeScript 5.9**: Lenguaje de programación
- **RxJS 7.8**: Programación reactiva con Observables y BehaviorSubject
- **Angular Signals**: Estado reactivo moderno de Angular

### UI/UX
- **Angular Material 21**: Componentes de UI (cards, inputs, buttons, icons)
- **Tailwind CSS 3.x**: Framework de utilidades CSS para diseño responsive
- **ng2-charts + Chart.js**: Librería de gráficos para visualización de datos

### Utilidades
- **date-fns**: Manipulación de fechas
- **jwt-decode**: Decodificación de tokens JWT

## 🔐 Flujo de Autenticación

### 1. Login
```typescript
// Usuario ingresa credenciales en LoginComponent
const credentials: LoginDTO = { email, password };

// AuthService consume POST /api/auth/login
authService.login(credentials).subscribe(response => {
  // 1. Almacenar token en localStorage
  // 2. Decodificar JWT para extraer información del usuario
  // 3. Actualizar BehaviorSubject con usuario autenticado
  // 4. Redirigir a dashboard
});
```

### 2. Interceptor JWT
```typescript
// Todas las peticiones HTTP pasan por JwtInterceptor
intercept(request, next) {
  const token = authService.getToken();
  
  // Adjuntar token al header Authorization
  if (token && !isPublicUrl(request.url)) {
    request = request.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }
  
  return next.handle(request).pipe(
    catchError(error => {
      // Si error 401: logout automático
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/auth/login']);
      }
    })
  );
}
```

### 3. Route Guard
```typescript
// AuthGuard protege rutas
canActivate(route, state) {
  if (authService.isAuthenticated()) {
    return true;  // Usuario autenticado: permitir acceso
  }
  
  // Usuario NO autenticado: redirigir a login preservando returnUrl
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url }
  });
}
```

## 📊 Componente Dashboard Explicado

### Estructura del Componente

```typescript
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, MatCardModule, ...]
})
export class DashboardComponent implements OnInit {
  // Signals para estado reactivo
  transactions = signal<TransactionDTO[]>([]);
  isLoading = signal<boolean>(true);
  
  // Computed signals (se recalculan automáticamente)
  financialSummary = computed<FinancialSummary>(() => {
    return this.transactionService.calculateFinancialSummary(
      this.transactions()
    );
  });
  
  expenseSummary = computed<CategorySummary[]>(() => {
    return this.transactionService.getCategorySummary(
      this.transactions(), 
      TransactionType.EXPENSE
    );
  });
  
  // Datos del gráfico (computed)
  pieChartData = computed<ChartData<'pie'>>(() => {
    const summary = this.expenseSummary();
    return {
      labels: summary.map(s => s.category),
      datasets: [{
        data: summary.map(s => s.totalAmount),
        backgroundColor: ['#FF6384', '#36A2EB', ...]
      }]
    };
  });
}
```

### Carga de Datos

```typescript
private loadDashboardData(): void {
  this.isLoading.set(true);
  
  // Combinar peticiones de transacciones y suscripciones
  combineLatest([
    this.transactionService.getAllTransactions(),
    this.subscriptionService.getAllSubscriptions()
  ])
  .pipe(takeUntil(this.destroy$))  // Prevenir memory leaks
  .subscribe({
    next: ([transactions, subscriptions]) => {
      // Actualizar signals
      this.transactions.set(transactions);
      
      // Los computed signals se recalculan automáticamente
      this.isLoading.set(false);
    },
    error: (error) => {
      this.errorMessage.set('Error al cargar datos');
      this.isLoading.set(false);
    }
  });
}
```

### Template con Tailwind + Material

```html
<!-- Grid responsive con Tailwind -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  
  <!-- Card de Material con clases de Tailwind -->
  <mat-card class="shadow-lg hover:shadow-xl transition">
    <mat-card-header>
      <div class="flex items-center gap-3">
        <div class="p-3 bg-green-100 rounded-full">
          <mat-icon class="text-green-600">trending_up</mat-icon>
        </div>
        <mat-card-title>Total Ingresos</mat-card-title>
      </div>
    </mat-card-header>
    <mat-card-content>
      <p class="text-3xl font-bold text-green-600">
        {{ formatCurrency(financialSummary().totalIncome) }}
      </p>
    </mat-card-content>
  </mat-card>
  
</div>

<!-- Gráfico de pastel con ng2-charts -->
<canvas 
  baseChart
  [data]="pieChartData()"
  [options]="pieChartOptions"
  type="pie">
</canvas>
```

## 🚀 Configuración y Ejecución

### 1. Instalar Dependencias
```bash
cd FrontMicrofinanzas
npm install
```

### 2. Configurar URL del Backend
Editar `src/app/core/services/*.service.ts` y ajustar la URL del API:
```typescript
private readonly API_URL = 'http://localhost:8080/api/...';
```

### 3. Ejecutar en Desarrollo
```bash
npm start
# o
ng serve
```

La aplicación estará disponible en `http://localhost:4200`

### 4. Compilar para Producción
```bash
ng build --configuration production
```

## 📝 Rutas de la Aplicación

| Ruta | Componente | Protegida | Descripción |
|------|-----------|-----------|-------------|
| `/` | - | No | Redirige a `/dashboard` |
| `/auth/login` | LoginComponent | No | Inicio de sesión |
| `/auth/register` | RegisterComponent | No | Registro de usuario |
| `/dashboard` | DashboardComponent | Sí | Dashboard principal |
| `**` | - | No | Redirige a `/dashboard` |

## 🔌 Endpoints del Backend Consumidos

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario

### Transacciones
- `GET /api/transactions` - Obtener todas las transacciones
- `POST /api/transactions` - Crear transacción
- `PUT /api/transactions/{id}` - Actualizar transacción
- `DELETE /api/transactions/{id}` - Eliminar transacción
- `GET /api/transactions/type/{type}` - Filtrar por tipo
- `GET /api/transactions/category/{category}` - Filtrar por categoría
- `GET /api/transactions/date-range?start={}&end={}` - Filtrar por fechas

### Suscripciones
- `GET /api/subscriptions` - Obtener todas las suscripciones
- `GET /api/subscriptions/active` - Obtener suscripciones activas
- `POST /api/subscriptions` - Crear suscripción
- `PUT /api/subscriptions/{id}/pause` - Pausar suscripción
- `PUT /api/subscriptions/{id}/cancel` - Cancelar suscripción
- `PUT /api/subscriptions/{id}/reactivate` - Reactivar suscripción
- `DELETE /api/subscriptions/{id}` - Eliminar suscripción

## 🎯 Próximos Pasos Recomendados

1. **Implementar módulo de Transacciones**
   - Lista de transacciones con tabla de Material
   - Formulario de crear/editar transacción
   - Filtros por tipo, categoría y fechas

2. **Implementar módulo de Suscripciones**
   - Lista de suscripciones con tarjetas
   - Gestión de estados (pausar, cancelar, reactivar)
   - Recordatorios de próximas fechas de cobro

3. **Agregar componentes Shared**
   - Navbar con menú de navegación
   - Sidebar para navegación lateral
   - Loading spinner global
   - Componente de notificaciones/snackbar

4. **Mejoras de UI/UX**
   - Dark mode toggle
   - Animaciones de transición entre rutas
   - Skeleton loaders
   - Formularios más interactivos

5. **Optimizaciones**
   - Implementar paginación en listas
   - Cache de datos con service workers
   - Optimistic updates en mutaciones
   - Error boundary y manejo global de errores

## 📚 Conceptos Clave Implementados

### 1. Componentes Standalone
Todos los componentes de features son standalone, lo que permite:
- Lazy loading más eficiente
- Menor tamaño de bundles
- Mayor modularidad

### 2. Signals y Computed
- `signal()`: Estado reactivo mutable
- `computed()`: Valores derivados que se recalculan automáticamente
- Mejor performance que observables en algunos casos

### 3. BehaviorSubject Pattern
```typescript
private dataSubject = new BehaviorSubject<Data[]>([]);
public data$ = this.dataSubject.asObservable();

// Actualizar desde el servicio
this.dataSubject.next(newData);

// Suscribirse desde componentes
service.data$.subscribe(data => { ... });
```

### 4. Barrel Files
```typescript
// src/app/core/models/index.ts
export * from './enums';
export * from './transaction.model';
export * from './subscription.model';
export * from './user.model';

// Importación simplificada
import { TransactionDTO, UserDTO } from '@core/models';
```

## 👨‍💻 Autor

Desarrollado como ejemplo de arquitectura modular Angular para aplicación de finanzas personales.

---

**Nota**: Asegúrate de que el backend esté ejecutándose en `http://localhost:8080` antes de iniciar el frontend.
