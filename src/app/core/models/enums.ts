/**
 * Enumeraciones que coinciden con el modelo de dominio del backend
 * Estas enums se usan en DTOs y componentes para tipar correctamente
 * los valores de transacciones y suscripciones
 */

/**
 * Tipo de transacción: Ingreso o Gasto
 * Backend: com.silva.microfinanzas.domain.valueobjects.TransactionType
 */
export enum TransactionType {
  INCOME = 'INCOME',   // Ingreso de dinero
  EXPENSE = 'EXPENSE'  // Gasto de dinero
}

/**
 * Estado de una suscripción
 * Backend: com.silva.microfinanzas.domain.valueobjects.SubscriptionStatus
 */
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',       // Suscripción activa
  PAUSED = 'PAUSED',       // Suscripción pausada temporalmente
  CANCELLED = 'CANCELLED'  // Suscripción cancelada permanentemente
}

/**
 * Rol de usuario en el sistema
 * Backend: com.silva.microfinanzas.domain.entities.User (roles)
 */
export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN'
}
