import { environment } from 'src/environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import {
  TransactionDTO,
  CreateTransactionDTO,
  TransactionType,
  CategorySummary,
  FinancialSummary
} from '../models';

/**
 * Servicio para gestionar transacciones consumiendo el API REST
 * 
 * Responsabilidades:
 * - Realizar operaciones CRUD sobre transacciones
 * - Mantener estado local reactivo de transacciones con BehaviorSubject
 * - Filtrar transacciones por tipo, categoría y rango de fechas
 * - Calcular resúmenes financieros y agrupaciones por categoría
 * 
 * Backend endpoints:
 * - GET /api/transactions - Obtener todas las transacciones del usuario
 * - GET /api/transactions/{id} - Obtener una transacción específica
 * - POST /api/transactions - Crear nueva transacción
 * - PUT /api/transactions/{id} - Actualizar transacción
 * - DELETE /api/transactions/{id} - Eliminar transacción
 * - GET /api/transactions/type/{type} - Filtrar por tipo (INCOME/EXPENSE)
 * - GET /api/transactions/category/{category} - Filtrar por categoría
 * - GET /api/transactions/date-range?start={}&end={} - Filtrar por rango de fechas
 */
@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  // URL base del backend (ajustar según configuración)
  private readonly API_URL = `${environment.apiUrlBase}/api/transactions`;

  /**
   * BehaviorSubject que mantiene el estado de todas las transacciones
   * Permite que los componentes se suscriban y reciban actualizaciones reactivas
   */
  private transactionsSubject = new BehaviorSubject<TransactionDTO[]>([]);
  public transactions$ = this.transactionsSubject.asObservable();

  constructor(private http: HttpClient) { }

  /**
   * Obtiene todas las transacciones del usuario autenticado
   * GET /api/transactions
   * 
   * Actualiza el BehaviorSubject con las transacciones obtenidas
   */
  getAllTransactions(): Observable<TransactionDTO[]> {
    return this.http.get<TransactionDTO[]>(this.API_URL)
      .pipe(
        tap(transactions => {
          this.transactionsSubject.next(transactions);
        })
      );
  }

  /**
   * Obtiene una transacción específica por ID
   * GET /api/transactions/{id}
   * 
   * @param id - UUID de la transacción
   */
  getTransactionById(id: number): Observable<TransactionDTO> {
    return this.http.get<TransactionDTO>(`${this.API_URL}/${id}`);
  }

  /**
   * Crea una nueva transacción
   * POST /api/transactions
   * 
   * @param transaction - DTO con los datos de la nueva transacción
   * @returns Observable con la transacción creada (incluye ID generado)
   * 
   * Actualiza el estado local añadiendo la nueva transacción
   */
  createTransaction(transaction: CreateTransactionDTO): Observable<TransactionDTO> {
    return this.http.post<TransactionDTO>(this.API_URL, transaction)
      .pipe(
        tap(newTransaction => {
          const current = this.transactionsSubject.value;
          this.transactionsSubject.next([...current, newTransaction]);
        })
      );
  }

  /**
   * Actualiza una transacción existente
   * PUT /api/transactions/{id}
   * 
   * @param id - UUID de la transacción a actualizar
   * @param transaction - Datos actualizados
   * @returns Observable con la transacción actualizada
   * 
   * Actualiza el estado local reemplazando la transacción modificada
   */
  updateTransaction(id: number, transaction: CreateTransactionDTO): Observable<TransactionDTO> {
    return this.http.put<TransactionDTO>(`${this.API_URL}/${id}`, transaction)
      .pipe(
        tap(updatedTransaction => {
          const current = this.transactionsSubject.value;
          const index = current.findIndex(t => t.id === id);
          if (index !== -1) {
            current[index] = updatedTransaction;
            this.transactionsSubject.next([...current]);
          }
        })
      );
  }

  /**
   * Elimina una transacción
   * DELETE /api/transactions/{id}
   * 
   * @param id - UUID de la transacción a eliminar
   * 
   * Actualiza el estado local removiendo la transacción eliminada
   */
  deleteTransaction(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`)
      .pipe(
        tap(() => {
          const current = this.transactionsSubject.value;
          this.transactionsSubject.next(current.filter(t => t.id !== id));
        })
      );
  }

  /**
   * Filtra transacciones por tipo (INCOME o EXPENSE)
   * GET /api/transactions/type/{type}
   * 
   * @param type - Tipo de transacción (INCOME o EXPENSE)
   */
  getTransactionsByType(type: TransactionType): Observable<TransactionDTO[]> {
    return this.http.get<TransactionDTO[]>(`${this.API_URL}/type/${type}`);
  }

  /**
   * Filtra transacciones por categoría
   * GET /api/transactions/category/{category}
   * 
   * @param category - Nombre de la categoría (ej: "Alimentación", "Transporte")
   */
  getTransactionsByCategory(category: string): Observable<TransactionDTO[]> {
    return this.http.get<TransactionDTO[]>(`${this.API_URL}/category/${category}`);
  }

  /**
   * Filtra transacciones por rango de fechas
   * GET /api/transactions/date-range?start={startDate}&end={endDate}
   * 
   * @param startDate - Fecha inicial en formato YYYY-MM-DD
   * @param endDate - Fecha final en formato YYYY-MM-DD
   */
  getTransactionsByDateRange(startDate: string, endDate: string): Observable<TransactionDTO[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<TransactionDTO[]>(`${this.API_URL}/date-range`, { params });
  }

  /**
   * Calcula el resumen financiero a partir de las transacciones
   * Este cálculo se realiza en el frontend
   * 
   * @param transactions - Array de transacciones a analizar
   * @returns Resumen con ingresos, gastos, balance y total de transacciones
   */
  calculateFinancialSummary(transactions: TransactionDTO[]): FinancialSummary {
    const totalIncome = transactions
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = transactions
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpenses,
      balance: totalIncome - totalExpenses,
      currency: transactions[0]?.currency || 'USD',
      transactionCount: transactions.length
    };
  }

  /**
   * Agrupa transacciones por categoría y calcula totales
   * Útil para generar gráficos de pastel en el dashboard
   * 
   * @param transactions - Array de transacciones a agrupar
   * @param type - Opcional: filtrar solo INCOME o EXPENSE
   * @returns Array de resúmenes por categoría con totales y porcentajes
   */
  getCategorySummary(
    transactions: TransactionDTO[],
    type?: TransactionType
  ): CategorySummary[] {
    // Filtrar por tipo si se especifica
    const filtered = type
      ? transactions.filter(t => t.type === type)
      : transactions;

    // Agrupar por categoría
    const categoryMap = new Map<string, { total: number; count: number }>();

    filtered.forEach(transaction => {
      const current = categoryMap.get(transaction.category) || { total: 0, count: 0 };
      categoryMap.set(transaction.category, {
        total: current.total + transaction.amount,
        count: current.count + 1
      });
    });

    // Calcular total general para porcentajes
    const grandTotal = filtered.reduce((sum, t) => sum + t.amount, 0);

    // Convertir Map a array de CategorySummary
    const summary: CategorySummary[] = [];
    categoryMap.forEach((value, category) => {
      summary.push({
        category,
        totalAmount: value.total,
        transactionCount: value.count,
        percentage: grandTotal > 0 ? (value.total / grandTotal) * 100 : 0
      });
    });

    // Ordenar por monto total descendente
    return summary.sort((a, b) => b.totalAmount - a.totalAmount);
  }

  /**
   * Obtiene las categorías únicas de todas las transacciones
   * Útil para filtros y autocomplete
   */
  getUniqueCategories(): Observable<string[]> {
    return this.transactions$.pipe(
      map(transactions => {
        const categories = new Set(transactions.map(t => t.category));
        return Array.from(categories).sort();
      })
    );
  }
}
