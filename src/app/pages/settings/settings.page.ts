import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  IonContent,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonSelect,
  IonSelectOption,
  IonToggle,
} from '@ionic/angular/standalone';
import { Subscription } from 'rxjs';
import { Settings } from '../../models/session.model';
import { SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-settings',
  template: `
    <ion-content>
      <div class="settings-page">
        <header class="settings-header">
          <h1>Réglages</h1>
        </header>

        <ion-list>
          <ion-list-header>Apparence</ion-list-header>
          <ion-item>
            <ion-label>Mode sombre</ion-label>
            <ion-toggle
              [checked]="settings.theme === 'dark'"
              (ionChange)="toggleTheme($event.detail.checked)"
            />
          </ion-item>
        </ion-list>

        <ion-list>
          <ion-list-header>Méditation par défaut</ion-list-header>
          <ion-item>
            <ion-label>Durée (minutes)</ion-label>
            <ion-select
              [value]="settings.defaultDuration"
              (ionChange)="update({ defaultDuration: $event.detail.value })"
              interface="action-sheet"
            >
              @for (m of durationOptions; track m) {
                <ion-select-option [value]="m">{{ m }} min</ion-select-option>
              }
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-label>Temps d'installation</ion-label>
            <ion-select
              [value]="settings.warmupSeconds"
              (ionChange)="update({ warmupSeconds: $event.detail.value })"
              interface="action-sheet"
            >
              @for (w of warmupOptions; track w) {
                <ion-select-option [value]="w">{{ warmupLabel(w) }}</ion-select-option>
              }
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-label>Ambiance par défaut</ion-label>
            <ion-select
              [value]="settings.defaultSound"
              (ionChange)="update({ defaultSound: $event.detail.value })"
              interface="action-sheet"
            >
              @for (s of soundOptions; track s.id) {
                <ion-select-option [value]="s.id">{{ s.label }}</ion-select-option>
              }
            </ion-select>
          </ion-item>
        </ion-list>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .settings-page {
        padding: var(--space-4) var(--space-4) var(--space-8);
      }

      .settings-header h1 {
        margin: 0 0 var(--space-6);
        font-size: 1.5rem;
      }
    `,
  ],
  imports: [
    IonContent,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonToggle,
  ],
  standalone: true,
})
export class SettingsPage implements OnInit, OnDestroy {
  settings: Settings = {
    defaultDuration: 10,
    defaultSound: 'silence',
    intervalMinutes: 0,
    warmupSeconds: 10,
    theme: 'light',
  };

  durationOptions = [5, 10, 15, 20, 25, 30, 45, 60];
  warmupOptions = [0, 5, 10, 15, 20, 30];
  soundOptions = [
    { id: 'silence', label: 'Silence' },
    { id: 'brown-noise', label: 'Bruit brun' },
    { id: 'white-noise', label: 'Bruit blanc' },
    { id: 'rain', label: 'Pluie' },
    { id: 'ocean', label: 'Océan' },
    { id: 'wind', label: 'Vent' },
  ];

  private sub?: Subscription;

  constructor(private readonly settingsService: SettingsService) {}

  ngOnInit(): void {
    this.sub = this.settingsService.settings$.subscribe((s) => {
      this.settings = s;
      this.applyTheme(s.theme);
    });
  }

  async update(partial: Partial<Settings>): Promise<void> {
    await this.settingsService.update(partial);
  }

  async toggleTheme(dark: boolean): Promise<void> {
    await this.update({ theme: dark ? 'dark' : 'light' });
  }

  warmupLabel(seconds: number): string {
    if (seconds === 0) return 'Aucun';
    return `${seconds} s`;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private applyTheme(theme: 'light' | 'dark'): void {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }
}
