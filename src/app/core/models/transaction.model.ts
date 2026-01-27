import { TransactionType } from './enums';

/**
 * Interfaz que representa el Value Object Money del backend
 * Backend: com.silva.microfinanzas.domain.valueobjects.Money
 * 
 * Encapsula el valor monetario con su moneda asociada
 */
export interface Money {
  amount: number;     // Cantidad de dinero (puede tener decimales)
  currency: string;   // Código de moneda ISO (USD, EUR, MXN, etc.)
}

/**
 * DTO para crear una nueva transacción
 * Backend: com.silva.microfinanzas.application.dtos.CreateTransactionDTO
 * 
 * Se envía al endpoint POST /api/transactions
 */
export interface CreateTransactionDTO {
  amount: number;              // Cantidad de la transacción
  currency: string;            // Moneda (USD, EUR, etc.)
  type: TransactionType;       // INCOME o EXPENSE
  category: string;            // Categoría de la transacción (ej: "Alimentación", "Salario")
  description?: string;        // Descripción opcional
  transactionDate: string;     // Fecha en formato ISO 8601 (YYYY-MM-DD)
}

/**
 * DTO que representa una transacción completa con ID
 * Backend: com.silva.microfinanzas.application.dtos.TransactionDTO
 * 
 * Se recibe del endpoint GET /api/transactions
 */
export interface TransactionDTO {
  id: number;                  // ID de la transacción (Long en backend)
  userId: string;              // UUID del usuario propietario
  amount: number;              // Cantidad de la transacción
  currency: string;            // Moneda
  type: TransactionType;       // INCOME o EXPENSE
  category: string;            // Categoría
  description?: string;        // Descripción opcional
  transactionDate: string;     // Fecha de la transacción (ISO 8601)
  createdAt: string;           // Fecha de creación (ISO 8601)
  updatedAt?: string;          // Fecha de última actualización (ISO 8601)
}

/**
 * Interfaz para representar el resumen de transacciones agrupadas por categoría
 * Se usa en el dashboard para mostrar gráficos de pastel
 */
export interface CategorySummary {
  category: string;            // Nombre de la categoría
  totalAmount: number;         // Total gastado/ingresado en esta categoría
  transactionCount: number;    // Número de transacciones en la categoría
  percentage: number;          // Porcentaje del total
}

/**
 * Interfaz para el resumen financiero del dashboard
 * Calculado en el frontend a partir de las transacciones
 */
export interface FinancialSummary {
  totalIncome: number;         // Total de ingresos
  totalExpenses: number;       // Total de gastos
  balance: number;             // Balance (ingresos - gastos)
  currency: string;            // Moneda principal del usuario
  transactionCount: number;    // Número total de transacciones
}
