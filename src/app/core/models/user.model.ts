import { UserRole } from './enums';

/**
 * DTO para iniciar sesión
 * Backend: com.silva.microfinanzas.application.dtos.LoginDTO
 * 
 * Se envía al endpoint POST /api/auth/login
 */
export interface LoginDTO {
  email: string;       // Email del usuario
  password: string;    // Contraseña
}

/**
 * DTO para registrar un nuevo usuario
 * Backend: com.silva.microfinanzas.application.dtos.CreateUserDTO
 * 
 * Se envía al endpoint POST /api/auth/register
 */
export interface CreateUserDTO {
  email: string;       // Email del usuario (debe ser único)
  password: string;    // Contraseña (mínimo 8 caracteres)
  fullName: string;    // Nombre completo del usuario
}

/**
 * DTO de respuesta JWT tras login exitoso
 * Backend: com.silva.microfinanzas.application.dtos.JwtResponseDTO
 * 
 * Se recibe del endpoint POST /api/auth/login
 */
export interface JwtResponseDTO {
  token: string;           // Token JWT para autenticación
  refreshToken: string;    // Token de renovación (válido 7 días)
  type: string;            // Tipo de token (normalmente "Bearer")
  email: string;           // Email del usuario autenticado
  roles: UserRole[];       // Roles del usuario (USER, ADMIN)
}

/**
 * DTO con información del perfil de usuario
 * Backend: com.silva.microfinanzas.application.dtos.UserDTO
 * 
 * Se recibe del endpoint GET /api/users/profile (si existe)
 */
export interface UserDTO {
  id: string;              // UUID del usuario
  email: string;           // Email del usuario
  fullName: string;        // Nombre completo
  enabled: boolean;        // Si la cuenta está habilitada
  roles: UserRole[];       // Roles asignados
  createdAt: string;       // Fecha de creación (ISO 8601)
}

/**
 * Interfaz para almacenar la información del usuario en el estado local
 * Se usa en AuthService con BehaviorSubject
 */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  token: string;
  refreshToken: string;
}
