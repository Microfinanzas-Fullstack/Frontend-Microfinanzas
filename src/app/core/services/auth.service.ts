import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import {
  LoginDTO,
  CreateUserDTO,
  JwtResponseDTO,
  AuthUser
} from '../models';

/**
 * Servicio de autenticación con gestión de tokens JWT
 * 
 * Responsabilidades:
 * - Iniciar sesión y registrar usuarios consumiendo el API REST
 * - Almacenar y gestionar tokens JWT en localStorage
 * - Mantener estado reactivo del usuario autenticado con BehaviorSubject
 * - Decodificar tokens JWT para extraer información del usuario
 * - Proporcionar métodos para verificar autenticación
 * 
 * Backend endpoints:
 * - POST /api/auth/login - Iniciar sesión
 * - POST /api/auth/register - Registrar nuevo usuario
 * 
 * NOTA: Compatible con SSR (Server-Side Rendering)
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // URL base del backend (ajustar según configuración)
  private readonly API_URL = 'http://localhost:8080/api/auth';

  // Claves para localStorage
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'auth_user';

  // Flag para saber si estamos en el navegador
  private isBrowser: boolean;

  /**
   * BehaviorSubject que mantiene el estado del usuario autenticado
   * - null: usuario no autenticado
   * - AuthUser: usuario autenticado con sus datos
   * 
   * Uso en componentes: authService.currentUser$ | async
   */
  private currentUserSubject: BehaviorSubject<AuthUser | null>;
  public currentUser$: Observable<AuthUser | null>;

  /**
   * Observable derivado que indica si hay un usuario autenticado
   * Útil para mostrar/ocultar elementos en el template
   */
  public isAuthenticated$: Observable<boolean>;

  constructor(
    private http: HttpClient,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(this.platformId);

    // Inicializar BehaviorSubject con usuario almacenado (si existe y estamos en browser)
    const storedUser = this.getUserFromStorage();
    this.currentUserSubject = new BehaviorSubject<AuthUser | null>(storedUser);
    this.currentUser$ = this.currentUserSubject.asObservable();

    // Crear observable derivado para verificación de autenticación
    this.isAuthenticated$ = new Observable(observer => {
      this.currentUser$.subscribe(user => observer.next(!!user));
    });
  }

  /**
   * Obtiene el valor actual del usuario (snapshot, no observable)
   * Útil para guards y verificaciones síncronas
   */
  public get currentUserValue(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Obtiene el token JWT actual
   * @returns Token JWT o null si no existe
   */
  public getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Obtiene el refresh token
   * @returns Refresh token o null si no existe
   */
  public getRefreshToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  /**
   * Verifica si el usuario está autenticado
   * @returns true si hay un token válido
   */
  public isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Verificar si el token no ha expirado
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  /**
   * Inicia sesión consumiendo el endpoint POST /api/auth/login
   * 
   * @param credentials - Email y contraseña
   * @returns Observable con la respuesta JWT del backend
   * 
   * En caso de éxito:
   * - Almacena tokens en localStorage
   * - Decodifica el JWT para extraer información del usuario
   * - Actualiza el BehaviorSubject con el usuario autenticado
   */
  login(credentials: LoginDTO): Observable<JwtResponseDTO> {
    return this.http.post<JwtResponseDTO>(`${this.API_URL}/login`, credentials)
      .pipe(
        tap(response => {
          if (this.isBrowser) {
            // Almacenar tokens en localStorage
            localStorage.setItem(this.TOKEN_KEY, response.token);
            localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);

            // Decodificar token para extraer información del usuario
            const decodedToken: any = jwtDecode(response.token);

            // Crear objeto AuthUser con la información del token
            const user: AuthUser = {
              id: decodedToken.sub || decodedToken.userId, // 'sub' es el estándar JWT
              email: response.email,
              fullName: decodedToken.fullName || response.email,
              roles: response.roles,
              token: response.token,
              refreshToken: response.refreshToken
            };

            // Almacenar usuario en localStorage
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));

            // Actualizar BehaviorSubject
            this.currentUserSubject.next(user);
          }
        })
      );
  }

  /**
   * Registra un nuevo usuario consumiendo el endpoint POST /api/auth/register
   * 
   * @param userData - Email, contraseña y nombre completo
   * @returns Observable con la respuesta JWT del backend
   * 
   * Nota: Algunos backends retornan JWT tras el registro, otros solo confirman.
   * Ajustar según el comportamiento real del backend.
   */
  register(userData: CreateUserDTO): Observable<JwtResponseDTO> {
    return this.http.post<JwtResponseDTO>(`${this.API_URL}/register`, userData)
      .pipe(
        tap(response => {
          if (this.isBrowser) {
            // Mismo proceso que login: almacenar tokens y actualizar estado
            localStorage.setItem(this.TOKEN_KEY, response.token);
            localStorage.setItem(this.REFRESH_TOKEN_KEY, response.refreshToken);

            const decodedToken: any = jwtDecode(response.token);

            const user: AuthUser = {
              id: decodedToken.sub || decodedToken.userId,
              email: response.email,
              fullName: userData.fullName,
              roles: response.roles,
              token: response.token,
              refreshToken: response.refreshToken
            };

            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            this.currentUserSubject.next(user);
          }
        })
      );
  }

  /**
   * Cierra la sesión del usuario
   * 
   * - Limpia todos los datos de localStorage
   * - Actualiza el BehaviorSubject a null
   * - Opcionalmente podría llamar a un endpoint /logout en el backend
   */
  logout(): void {
    if (this.isBrowser) {
      // Limpiar localStorage
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }

    // Actualizar estado a usuario no autenticado
    this.currentUserSubject.next(null);
  }

  /**
   * Recupera el usuario almacenado en localStorage (usado al inicializar)
   * 
   * @returns Usuario autenticado o null si no existe o el token expiró
   */
  private getUserFromStorage(): AuthUser | null {
    if (!this.isBrowser) return null;

    const userJson = localStorage.getItem(this.USER_KEY);
    if (!userJson) return null;

    try {
      const user: AuthUser = JSON.parse(userJson);

      // Verificar que el token siga siendo válido
      if (!this.isTokenValid(user.token)) {
        this.clearStorage();
        return null;
      }

      return user;
    } catch (error) {
      this.clearStorage();
      return null;
    }
  }

  /**
   * Verifica si un token JWT es válido (no expirado)
   * 
   * @param token - Token JWT a verificar
   * @returns true si el token es válido
   */
  private isTokenValid(token: string): boolean {
    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  /**
   * Limpia todos los datos de autenticación del localStorage
   */
  private clearStorage(): void {
    if (this.isBrowser) {
      localStorage.removeItem(this.TOKEN_KEY);
      localStorage.removeItem(this.REFRESH_TOKEN_KEY);
      localStorage.removeItem(this.USER_KEY);
    }
  }
}
