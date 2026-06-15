import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StorageService {
  async get<T>(key: string): Promise<T | null> {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    localStorage.setItem(key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    localStorage.removeItem(key);
  }
}
