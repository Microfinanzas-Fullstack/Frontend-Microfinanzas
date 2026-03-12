import { environment } from '../../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { 
  SubscriptionDTO, 
  CreateSubscriptionDTO,
  SubscriptionStatus,
  SubscriptionSummary
} from '../models';

/**
 * Servicio para gestionar suscripciones consumiendo el API REST
 * 
 * Responsabilidades:
 * - Realizar operaciones CRUD sobre suscripciones
 * - Mantener estado local reactivo de suscripciones con BehaviorSubject
 * - Gestionar el ciclo de vida de suscripciones (pausar, cancelar, reactivar)
 * - Calcular resumen de gastos mensuales en suscripciones
 * 
 * Backend endpoints:
 * - GET /api/subscriptions - Obtener todas las suscripciones del usuario
 * - GET /api/subscriptions/active - Obtener solo suscripciones activas
 * - GET /api/subscriptions/{id} - Obtener una suscripción específica
 * - POST /api/subscriptions - Crear nueva suscripción
 * - PUT /api/subscriptions/{id}/pause - Pausar suscripción
 * - PUT /api/subscriptions/{id}/cancel - Cancelar suscripción
 * - PUT /api/subscriptions/{id}/reactivate - Reactivar suscripción
 * - DELETE /api/subscriptions/{id} - Eliminar suscripción
 */
@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  // URL base del backend (ajustar según configuración)
  private readonly API_URL = `${environment.apiUrlBase}/api/subscriptions`;

  /**
   * BehaviorSubject que mantiene el estado de todas las suscripciones
   * Permite que los componentes se suscriban y reciban actualizaciones reactivas
   */
  private subscriptionsSubject = new BehaviorSubject<SubscriptionDTO[]>([]);
  public subscriptions$ = this.subscriptionsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Obtiene todas las suscripciones del usuario autenticado
   * GET /api/subscriptions
   * 
   * Actualiza el BehaviorSubject con las suscripciones obtenidas
   */
  getAllSubscriptions(): Observable<SubscriptionDTO[]> {
    return this.http.get<SubscriptionDTO[]>(this.API_URL)
      .pipe(
        tap(subscriptions => {
          this.subscriptionsSubject.next(subscriptions);
        })
      );
  }

  /**
   * Obtiene solo las suscripciones activas
   * GET /api/subscriptions/active
   * 
   * Útil para mostrar en el dashboard las suscripciones que generan gastos
   */
  getActiveSubscriptions(): Observable<SubscriptionDTO[]> {
    return this.http.get<SubscriptionDTO[]>(`${this.API_URL}/active`);
  }

  /**
   * Obtiene una suscripción específica por ID
   * GET /api/subscriptions/{id}
   * 
   * @param id - UUID de la suscripción
   */
  getSubscriptionById(id: string): Observable<SubscriptionDTO> {
    return this.http.get<SubscriptionDTO>(`${this.API_URL}/${id}`);
  }

  /**
   * Crea una nueva suscripción
   * POST /api/subscriptions
   * 
   * @param subscription - DTO con los datos de la nueva suscripción
   * @returns Observable con la suscripción creada (incluye ID generado)
   * 
   * Actualiza el estado local añadiendo la nueva suscripción
   */
  createSubscription(subscription: CreateSubscriptionDTO): Observable<SubscriptionDTO> {
    return this.http.post<SubscriptionDTO>(this.API_URL, subscription)
      .pipe(
        tap(newSubscription => {
          const current = this.subscriptionsSubject.value;
          this.subscriptionsSubject.next([...current, newSubscription]);
        })
      );
  }

  /**
   * Pausa una suscripción activa
   * PUT /api/subscriptions/{id}/pause
   * 
   * @param id - UUID de la suscripción a pausar
   * 
   * Una suscripción pausada no genera cargos pero mantiene la información
   * Actualiza el estado local
   */
  pauseSubscription(id: string): Observable<SubscriptionDTO> {
    return this.http.put<SubscriptionDTO>(`${this.API_URL}/${id}/pause`, {})
      .pipe(
        tap(updatedSubscription => {
          this.updateLocalSubscription(id, updatedSubscription);
        })
      );
  }

  /**
   * Cancela una suscripción permanentemente
   * PUT /api/subscriptions/{id}/cancel
   * 
   * @param id - UUID de la suscripción a cancelar
   * 
   * Una suscripción cancelada no puede ser reactivada (estado final)
   * Actualiza el estado local
   */
  cancelSubscription(id: string): Observable<SubscriptionDTO> {
    return this.http.put<SubscriptionDTO>(`${this.API_URL}/${id}/cancel`, {})
      .pipe(
        tap(updatedSubscription => {
          this.updateLocalSubscription(id, updatedSubscription);
        })
      );
  }

  /**
   * Reactiva una suscripción pausada
   * PUT /api/subscriptions/{id}/reactivate
   * 
   * @param id - UUID de la suscripción a reactivar
   * 
   * Solo funciona en suscripciones con estado PAUSED
   * Actualiza el estado local
   */
  reactivateSubscription(id: string): Observable<SubscriptionDTO> {
    return this.http.put<SubscriptionDTO>(`${this.API_URL}/${id}/reactivate`, {})
      .pipe(
        tap(updatedSubscription => {
          this.updateLocalSubscription(id, updatedSubscription);
        })
      );
  }

  /**
   * Elimina una suscripción permanentemente
   * DELETE /api/subscriptions/{id}
   * 
   * @param id - UUID de la suscripción a eliminar
   * 
   * Actualiza el estado local removiendo la suscripción eliminada
   */
  deleteSubscription(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`)
      .pipe(
        tap(() => {
          const current = this.subscriptionsSubject.value;
          this.subscriptionsSubject.next(current.filter(s => s.id !== id));
        })
      );
  }

  /**
   * Calcula el resumen de suscripciones
   * Este cálculo se realiza en el frontend
   * 
   * @param subscriptions - Array de suscripciones a analizar
   * @returns Resumen con gasto mensual total y conteo por estado
   */
  calculateSubscriptionSummary(subscriptions: SubscriptionDTO[]): SubscriptionSummary {
    // Calcular gasto mensual solo de suscripciones activas
    const activeSubscriptions = subscriptions.filter(s => s.status === SubscriptionStatus.ACTIVE);
    
    const totalMonthlyAmount = activeSubscriptions.reduce((sum, sub) => {
      // Convertir el ciclo de facturación a meses (aproximado)
      const monthlyAmount = (sub.amount / sub.billingCycleDays) * 30;
      return sum + monthlyAmount;
    }, 0);

    return {
      totalMonthlyAmount: Math.round(totalMonthlyAmount * 100) / 100, // Redondear a 2 decimales
      activeCount: activeSubscriptions.length,
      pausedCount: subscriptions.filter(s => s.status === SubscriptionStatus.PAUSED).length,
      currency: subscriptions[0]?.currency || 'USD'
    };
  }

  /**
   * Actualiza una suscripción en el estado local
   * Método auxiliar usado por pausar, cancelar y reactivar
   * 
   * @param id - UUID de la suscripción
   * @param updatedSubscription - Suscripción actualizada del backend
   */
  private updateLocalSubscription(id: string, updatedSubscription: SubscriptionDTO): void {
    const current = this.subscriptionsSubject.value;
    const index = current.findIndex(s => s.id === id);
    if (index !== -1) {
      current[index] = updatedSubscription;
      this.subscriptionsSubject.next([...current]);
    }
  }
}
