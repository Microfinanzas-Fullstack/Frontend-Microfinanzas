import { Component, OnInit, OnDestroy, signal, computed, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData } from 'chart.js';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

// Servicios y modelos
import { TransactionService } from '../../core/services/transaction.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import {
  TransactionDTO,
  TransactionType,
  FinancialSummary,
  CategorySummary,
  SubscriptionSummary
} from '../../core/models';

/**
 * Componente Dashboard - Resumen de Finanzas Personales
 * 
 * Responsabilidades:
 * - Mostrar resumen financiero (ingresos, gastos, balance) en cards
 * - Visualizar gráfico de pastel con gastos por categoría
 * - Mostrar resumen de suscripciones activas
 * - Usar señales (signals) de Angular para gestión de estado reactivo
 * - Consumir servicios de transacciones y suscripciones
 * 
 * Características:
 * - Componente standalone con imports necesarios
 * - Gestión de memoria con takeUntil para evitar memory leaks
 * - Uso de signals para estado reactivo y computed para valores derivados
 * - Integración con ng2-charts para gráfico de pastel
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    BaseChartDirective,
    MatCardModule,
    MatProgressSpinnerModule,
    MatIconModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {
  /**
   * Subject para gestionar la destrucción de suscripciones
   * Previene memory leaks al desuscribirse automáticamente en ngOnDestroy
   */
  private destroy$ = new Subject<void>();

  /**
   * Señales (signals) para gestión de estado reactivo
   * Las señales se actualizan automáticamente cuando cambian los datos
   */

  // Lista de transacciones cargadas
  transactions = signal<TransactionDTO[]>([]);

  // Estado de carga
  isLoading = signal<boolean>(true);

  // Mensaje de error si falla la carga
  errorMessage = signal<string | null>(null);

  /**
   * Valores computados (computed signals)
   * Se recalculan automáticamente cuando cambian las señales de las que dependen
   */

  // Resumen financiero (ingresos, gastos, balance)
  financialSummary = computed<FinancialSummary>(() => {
    return this.transactionService.calculateFinancialSummary(this.transactions());
  });

  // Resumen de gastos por categoría (para el gráfico de pastel)
  expenseSummary = computed<CategorySummary[]>(() => {
    return this.transactionService.getCategorySummary(
      this.transactions(),
      TransactionType.EXPENSE
    );
  });

  // Resumen de suscripciones
  subscriptionSummary = signal<SubscriptionSummary>({
    totalMonthlyAmount: 0,
    activeCount: 0,
    pausedCount: 0,
    currency: 'USD'
  });

  /**
   * Configuración del gráfico de pastel
   * Muestra la distribución de gastos por categoría
   */

  // Datos del gráfico (se actualizan cuando cambia expenseSummary)
  pieChartData = computed<ChartData<'pie'>>(() => {
    const summary = this.expenseSummary();
    return {
      labels: summary.map(s => s.category),
      datasets: [{
        data: summary.map(s => s.totalAmount),
        backgroundColor: [
          '#FF6384',  // Rosa
          '#36A2EB',  // Azul
          '#FFCE56',  // Amarillo
          '#4BC0C0',  // Turquesa
          '#9966FF',  // Púrpura
          '#FF9F40',  // Naranja
          '#C9CBCF',  // Gris
          '#7CFC00'   // Verde
        ],
        hoverBackgroundColor: [
          '#FF6384DD',
          '#36A2EBDD',
          '#FFCE56DD',
          '#4BC0C0DD',
          '#9966FFDD',
          '#FF9F40DD',
          '#C9CBCFDD',
          '#7CFC00DD'
        ]
      }]
    };
  });

  // Opciones del gráfico
  pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 15,
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const data = context.dataset.data as number[];
            const total = data.reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${label}: $${value.toFixed(2)} (${percentage}%)`;
          }
        }
      }
    }
  };

  private isBrowser: boolean;

  constructor(
    private transactionService: TransactionService,
    private subscriptionService: SubscriptionService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /**
   * Inicialización del componente
   * Carga datos de transacciones y suscripciones del backend
   */
  ngOnInit(): void {
    if (this.isBrowser) {
      this.loadDashboardData();
    }
  }

  /**
   * Limpieza al destruir el componente
   * Completa el Subject destroy$ para desuscribirse de todos los observables
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carga todos los datos necesarios para el dashboard
   * Combina las peticiones de transacciones y suscripciones
   */
  private loadDashboardData(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    // Combinar peticiones de transacciones y suscripciones
    combineLatest({
      transactions: this.transactionService.getAllTransactions(),
      subscriptions: this.subscriptionService.getAllSubscriptions()
    })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: ({ transactions, subscriptions }) => {
          // Actualizar señales con los datos obtenidos
          this.transactions.set(transactions);

          // Calcular resumen de suscripciones
          const subSummary = this.subscriptionService.calculateSubscriptionSummary(subscriptions);
          this.subscriptionSummary.set(subSummary);

          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error cargando datos del dashboard:', error);
          this.errorMessage.set('Error al cargar los datos. Por favor, intenta nuevamente.');
          this.isLoading.set(false);
        }
      });
  }

  /**
   * Formatea un número como moneda
   * Método auxiliar para el template
   * 
   * @param amount - Cantidad a formatear
   * @param currency - Código de moneda (USD, EUR, etc.)
   * @returns String formateado como moneda
   */
  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  /**
   * Recarga los datos del dashboard
   * Se puede llamar desde un botón de refresh en el template
   */
  refresh(): void {
    if (this.isBrowser) {
      this.loadDashboardData();
    }
  }
}
