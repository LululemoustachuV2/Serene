import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Session } from '../models/session.model';
import { AuthService } from './auth.service';

interface ApiSession {
  id: string;
  startTime: string;
  endTime: string;
  duration: number;
  completed: boolean;
  sound: string;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly sessionsSubject = new BehaviorSubject<Session[]>([]);
  readonly sessions$: Observable<Session[]> = this.sessionsSubject.asObservable();

  constructor(
    private readonly http: HttpClient,
    private readonly auth: AuthService,
  ) {}

  async load(): Promise<void> {
    if (!this.auth.isAuthenticated()) {
      this.sessionsSubject.next([]);
      return;
    }

    const data = await firstValueFrom(
      this.http.get<ApiSession[]>(`${environment.apiUrl}/sessions`),
    );
    this.sessionsSubject.next(data.map((s) => this.toSession(s)));
  }

  async add(session: Omit<Session, 'id'>): Promise<Session> {
    const created = await firstValueFrom(
      this.http.post<ApiSession>(`${environment.apiUrl}/sessions`, session),
    );
    const entry = this.toSession(created);
    this.sessionsSubject.next([entry, ...this.sessionsSubject.value]);
    return entry;
  }

  async delete(id: string): Promise<void> {
    await firstValueFrom(this.http.delete(`${environment.apiUrl}/sessions/${id}`));
    this.sessionsSubject.next(this.sessionsSubject.value.filter((s) => s.id !== id));
  }

  clear(): void {
    this.sessionsSubject.next([]);
  }

  get completedSessions(): Session[] {
    return this.sessionsSubject.value.filter((s) => s.completed);
  }

  private toSession(api: ApiSession): Session {
    return {
      id: api.id,
      startTime: api.startTime,
      endTime: api.endTime,
      duration: api.duration,
      completed: api.completed,
      sound: api.sound,
    };
  }
}
