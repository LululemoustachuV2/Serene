import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Session } from '../models/session.model';
import { StorageService } from './storage.service';

const STORAGE_KEY = 'serene-sessions';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly sessionsSubject = new BehaviorSubject<Session[]>([]);
  readonly sessions$: Observable<Session[]> = this.sessionsSubject.asObservable();

  constructor(private readonly storage: StorageService) {}

  async load(): Promise<void> {
    const stored = await this.storage.get<Session[]>(STORAGE_KEY);
    this.sessionsSubject.next(stored ?? []);
  }

  async add(session: Omit<Session, 'id'>): Promise<Session> {
    const entry: Session = { ...session, id: crypto.randomUUID() };
    const next = [entry, ...this.sessionsSubject.value];
    this.sessionsSubject.next(next);
    await this.storage.set(STORAGE_KEY, next);
    return entry;
  }

  async delete(id: string): Promise<void> {
    const next = this.sessionsSubject.value.filter((s) => s.id !== id);
    this.sessionsSubject.next(next);
    await this.storage.set(STORAGE_KEY, next);
  }

  get completedSessions(): Session[] {
    return this.sessionsSubject.value.filter((s) => s.completed);
  }
}
