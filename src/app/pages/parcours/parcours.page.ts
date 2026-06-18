import { Component, OnDestroy, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { trashOutline } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { ContributionCalendarComponent } from '../../components/contribution-calendar/contribution-calendar.component';
import { Session } from '../../models/session.model';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-parcours',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Parcours</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page-stack">
        <section class="stats-section" aria-label="Informations sur votre pratique">
          <div class="stat-grid">
            <div class="stat-card">
              <span class="stat-value">{{ totalTimeFormatted }}</span>
              <span class="stat-label">Temps médité</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ totalSessions }}</span>
              <span class="stat-label">Sessions</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ practiceDays }}</span>
              <span class="stat-label">Jours de pratique</span>
            </div>
            <div class="stat-card">
              <span class="stat-value">{{ averageFormatted }}</span>
              <span class="stat-label">Durée moyenne</span>
            </div>
          </div>
        </section>

        <section class="calendar-section">
          <h2 class="section-title">26 dernières semaines</h2>
          <app-contribution-calendar [practicedDates]="practicedDates" />
        </section>

        <section class="history-section">
          <h2 class="section-title">Sessions récentes</h2>
          @if (sessions.length === 0) {
            <p class="empty-state">
              Aucune session enregistrée pour le moment. Vos méditations apparaîtront ici.
            </p>
          } @else {
            <ion-list>
              @for (s of sessions; track s.id) {
                <ion-item>
                  <ion-label>
                    <h2>{{ s.startTime | date: 'EEEE d MMMM yyyy' }}</h2>
                    <p>{{ formatDuration(s.duration) }} · {{ soundLabel(s.sound) }}</p>
                  </ion-label>
                  <ion-button
                    slot="end"
                    fill="clear"
                    color="medium"
                    (click)="removeSession(s.id)"
                    aria-label="Supprimer la session"
                  >
                    <ion-icon slot="icon-only" name="trash-outline" />
                  </ion-button>
                </ion-item>
              }
            </ion-list>
          }
        </section>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .stats-section {
        margin-top: var(--space-2);
      }

      .stat-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--space-3);
      }

      .stat-card {
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
        padding: var(--space-4);
        border: 1px solid var(--color-border);
        border-radius: 2px;
        background: var(--color-surface);
      }

      .stat-value {
        font-family: var(--font-mono);
        font-size: 1.125rem;
        color: var(--color-text);
      }

      .stat-label {
        font-size: 0.75rem;
        color: var(--color-text-muted);
        letter-spacing: 0.02em;
      }

      .section-title {
        margin: 0 0 var(--space-3);
        font-family: var(--font-sans);
        font-size: 0.6875rem;
        font-weight: 600;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--color-text-muted);
      }

      .calendar-section,
      .history-section {
        margin-top: var(--space-2);
      }

      ion-item h2 {
        font-family: var(--font-sans);
        font-size: 0.9375rem;
        font-weight: 500;
      }
    `,
  ],
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonList,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    DatePipe,
    ContributionCalendarComponent,
  ],
  standalone: true,
})
export class ParcoursPage implements OnInit, OnDestroy {
  sessions: Session[] = [];
  practicedDates = new Set<string>();
  totalSessions = 0;
  totalTimeFormatted = '0 min';
  practiceDays = 0;
  averageFormatted = '—';

  private sub?: Subscription;

  constructor(private readonly sessionService: SessionService) {
    addIcons({ trashOutline });
  }

  ngOnInit(): void {
    this.sub = this.sessionService.sessions$.subscribe((sessions) => {
      const completed = sessions.filter((s) => s.completed);
      this.sessions = completed;
      this.totalSessions = completed.length;
      this.practicedDates = new Set(completed.map((s) => s.startTime.slice(0, 10)));
      this.practiceDays = this.practicedDates.size;

      const totalSec = completed.reduce((sum, s) => sum + s.duration, 0);
      this.totalTimeFormatted = this.formatTotalTime(totalSec);

      if (completed.length > 0) {
        const avgSec = Math.round(totalSec / completed.length);
        this.averageFormatted = this.formatDuration(avgSec);
      } else {
        this.averageFormatted = '—';
      }
    });
  }

  formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s} s`;
    if (s === 0) return `${m} min`;
    return `${m} min ${s} s`;
  }

  soundLabel(sound: string): string {
    const labels: Record<string, string> = {
      silence: 'Silence',
      'brown-noise': 'Bruit brun',
      'white-noise': 'Bruit blanc',
      rain: 'Pluie',
      ocean: 'Océan',
      wind: 'Vent',
    };
    return labels[sound] ?? sound;
  }

  async removeSession(id: string): Promise<void> {
    await this.sessionService.delete(id);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private formatTotalTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h} h ${m} min`;
    return `${m} min`;
  }
}
