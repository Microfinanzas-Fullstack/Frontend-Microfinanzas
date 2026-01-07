import { SubscriptionStatus } from './enums';

/**
 * DTO para crear una nueva suscripción
 * Backend: com.silva.microfinanzas.application.dtos.CreateSubscriptionDTO
 * 
 * Se envía al endpoint POST /api/subscriptions
 */
export interface CreateSubscriptionDTO {
  name: string;                // Nombre de la suscripción (ej: "Netflix", "Spotify")
  description?: string;        // Descripción opcional
  amount: number;              // Costo de la suscripción
  currency: string;            // Moneda (USD, EUR, etc.)
  billingCycleDays: number;    // Días del ciclo de facturación (30 = mensual, 365 = anual)
  nextBillingDate: string;     // Próxima fecha de cobro (ISO 8601)
}

/**
 * DTO que representa una suscripción completa con ID
 * Backend: com.silva.microfinanzas.application.dtos.SubscriptionDTO
 * 
 * Se recibe del endpoint GET /api/subscriptions
 */
export interface SubscriptionDTO {
  id: string;                  // UUID de la suscripción
  userId: string;              // UUID del usuario propietario
  name: string;                // Nombre de la suscripción
  description?: string;        // Descripción opcional
  amount: number;              // Costo de la suscripción
  currency: string;            // Moneda
  billingCycleDays: number;    // Días del ciclo de facturación
  nextBillingDate: string;     // Próxima fecha de cobro (ISO 8601)
  status: SubscriptionStatus;  // ACTIVE, PAUSED, o CANCELLED
  createdAt: string;           // Fecha de creación (ISO 8601)
  updatedAt?: string;          // Fecha de última actualización (ISO 8601)
}

/**
 * Interfaz para el resumen de suscripciones activas
 * Se usa en el dashboard para mostrar el gasto mensual en suscripciones
 */
export interface SubscriptionSummary {
  totalMonthlyAmount: number;  // Total mensual aproximado de todas las suscripciones activas
  activeCount: number;         // Número de suscripciones activas
  pausedCount: number;         // Número de suscripciones pausadas
  currency: string;            // Moneda principal
}
