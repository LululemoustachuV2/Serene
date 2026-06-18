import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Settings } from '../models/session.model';
import { StorageService } from './storage.service';

const STORAGE_KEY = 'serene-settings';

const DEFAULT_SETTINGS: Settings = {
  defaultDuration: 10,
  defaultSound: 'silence',
  intervalMinutes: 1,
  warmupSeconds: 10,
  theme: 'light',
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  readonly settings$ = new BehaviorSubject<Settings>({ ...DEFAULT_SETTINGS });

  constructor(private readonly storage: StorageService) {}

  async load(): Promise<void> {
    const stored = await this.storage.get<Settings>(STORAGE_KEY);
    if (stored) {
      this.settings$.next({ ...DEFAULT_SETTINGS, ...stored });
    }
  }

  async update(partial: Partial<Settings>): Promise<void> {
    const next = { ...this.settings$.value, ...partial };
    this.settings$.next(next);
    await this.storage.set(STORAGE_KEY, next);
  }
}
