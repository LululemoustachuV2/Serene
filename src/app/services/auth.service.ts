import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StorageService } from './storage.service';

const TOKEN_KEY = 'serene_token';
const USER_KEY = 'serene_user';

export interface AuthUser {
  id: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly userSubject = new BehaviorSubject<AuthUser | null>(null);
  readonly user$ = this.userSubject.asObservable();

  constructor(private readonly storage: StorageService) {}

  async init(): Promise<void> {
    const user = await this.storage.get<AuthUser>(USER_KEY);
    this.userSubject.next(user);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  getUser(): AuthUser | null {
    return this.userSubject.value;
  }

  async login(email: string, password: string): Promise<AuthUser> {
    const { environment } = await import('../../environments/environment');
    const response = await fetch(`${environment.apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        message?: string | string[];
      };
      const message = Array.isArray(body.message) ? body.message[0] : body.message;
      throw new Error(message ?? 'Connexion impossible');
    }

    const data = (await response.json()) as { accessToken: string; user: AuthUser };
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    await this.storage.set(USER_KEY, data.user);
    this.userSubject.next(data.user);
    return data.user;
  }

  async logout(): Promise<void> {
    localStorage.removeItem(TOKEN_KEY);
    await this.storage.remove(USER_KEY);
    this.userSubject.next(null);
  }
}
