import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonListHeader,
  IonRange,
  IonSelect,
  IonSelectOption,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { musicalNotes, pause, play, stop } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { SoundPickerComponent } from '../../components/sound-picker/sound-picker.component';
import { TimerCircleComponent } from '../../components/timer-circle/timer-circle.component';
import { AudioService, AmbientSound } from '../../services/audio.service';
import { SessionService } from '../../services/session.service';
import { SettingsService } from '../../services/settings.service';
import { TimerService, TimerStatus } from '../../services/timer.service';

@Component({
  selector: 'app-timer',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Minuteur</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="timer-layout">
        <app-timer-circle [status]="status" [hint]="hint" />

        <div class="controls">
        @if (status.state === 'idle') {
          <ion-button (click)="start()" shape="round" size="large">
            <ion-icon slot="icon-only" name="play" />
          </ion-button>
        }
        @if (status.state === 'preparing') {
          <ion-button (click)="stop()" shape="round" size="large" fill="outline">
            <ion-icon slot="icon-only" name="stop" />
          </ion-button>
        }
        @if (status.state === 'running') {
          <ion-button (click)="pause()" shape="round" size="large" fill="outline">
            <ion-icon slot="icon-only" name="pause" />
          </ion-button>
        }
        @if (status.state === 'paused') {
          <ion-button (click)="resume()" shape="round" size="large">
            <ion-icon slot="icon-only" name="play" />
          </ion-button>
          <ion-button (click)="stop()" shape="round" size="large" fill="outline">
            <ion-icon slot="icon-only" name="stop" />
          </ion-button>
        }
        @if (status.state === 'completed') {
          <ion-button (click)="finishSession()" shape="round" size="large">
            Terminer
          </ion-button>
        }
        </div>

        <div class="controls controls--secondary">
        @if (status.state === 'idle') {
          <ion-button (click)="changeDurationByDelta(-1)">-1 min</ion-button>
          <ion-button (click)="changeDurationByDelta(1)">+1 min</ion-button>
        }
        @if (status.state === 'running' || status.state === 'paused') {
          <ion-button (click)="adjust(-1)">-1 min</ion-button>
          <ion-button (click)="adjust(1)">+1 min</ion-button>
        }
        </div>

        <div class="timer-section">
          <ion-list>
            <ion-list-header>Ambiance sonore</ion-list-header>
        <ion-item>
          <app-sound-picker
            [active]="audioService.currentSound"
            (select)="selectSound($event)"
            (preview)="previewSound($event)"
            (stopPreview)="stopPreview()"
          />
        </ion-item>
        <ion-item>
          <ion-icon slot="start" name="musical-notes" />
          <ion-label>Volume</ion-label>
          <ion-range
            slot="end"
            [value]="audioService.volume"
            (ionChange)="changeVolume($event.detail.value)"
            min="0"
            max="1"
            step="0.05"
          />
        </ion-item>
        <ion-item>
          <ion-button fill="clear" color="dark" (click)="mute()">Couper le son</ion-button>
        </ion-item>
      </ion-list>

      @if (status.state === 'idle') {
        <ion-list>
          <ion-list-header>Durée</ion-list-header>
          <ion-item>
            <ion-label>Minutes</ion-label>
            <ion-select
              [value]="duration"
              (ionChange)="changeDuration($event.detail.value)"
              interface="popover"
            >
              @for (m of minutesOptions; track m) {
                <ion-select-option [value]="m">{{ m }}</ion-select-option>
              }
            </ion-select>
          </ion-item>
          <ion-item>
            <ion-label>Temps d'installation</ion-label>
            <ion-select
              [value]="warmupSeconds"
              (ionChange)="changeWarmup($event.detail.value)"
              interface="popover"
            >
              @for (w of warmupOptions; track w) {
                <ion-select-option [value]="w">{{ warmupLabel(w) }}</ion-select-option>
              }
            </ion-select>
          </ion-item>
        </ion-list>
      }
        </div>
      </div>
    </ion-content>
  `,
  styleUrl: './timer.page.scss',
  imports: [
    IonContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButton,
    IonIcon,
    IonList,
    IonListHeader,
    IonItem,
    IonLabel,
    IonSelect,
    IonSelectOption,
    IonRange,
    SoundPickerComponent,
    TimerCircleComponent,
  ],
  standalone: true,
})
export class TimerPage implements OnInit, OnDestroy {
  status: TimerStatus = {
    remainingSeconds: 0,
    totalSeconds: 0,
    progress: 0,
    state: 'idle',
    minutes: 0,
    seconds: 0,
    isWarmup: false,
  };
  hint = 'Pr?t ? m?diter';
  minutesOptions = [5, 10, 15, 20, 25, 30, 45, 60];
  warmupOptions = [0, 5, 10, 15, 20, 30];
  warmupSeconds = 10;

  private sub?: Subscription;
  private settingsSub?: Subscription;
  private previewBackup?: AmbientSound;
  private completionSaved = false;
  private currentSessionStart?: string;
  private previousState: TimerStatus['state'] = 'idle';

  constructor(
    readonly timerService: TimerService,
    readonly audioService: AudioService,
    private readonly sessionService: SessionService,
    private readonly settingsService: SettingsService,
  ) {
    addIcons({ play, pause, stop, 'musical-notes': musicalNotes });

    this.sub = this.timerService.status$.subscribe((s) => {
      this.status = s;
      this.hint =
        s.state === 'preparing'
          ? 'Installez-vous'
          : s.state === 'running'
            ? 'En cours'
            : s.state === 'completed'
              ? 'Session terminée'
              : 'Prêt à méditer';

      if (
        s.state === 'running' &&
        (this.previousState === 'idle' || this.previousState === 'preparing') &&
        !this.currentSessionStart
      ) {
        this.currentSessionStart = new Date().toISOString();
      }

      if (s.state === 'completed' && !this.completionSaved) {
        this.completionSaved = true;
        void this.saveCompletedSession(s);
        this.audioService.playBell();
      }

      if (s.state === 'idle') {
        this.completionSaved = false;
        this.currentSessionStart = undefined;
      }

      this.previousState = s.state;
    });
  }

  ngOnInit(): void {
    const initial = this.settingsService.settings$.value;
    this.warmupSeconds = initial.warmupSeconds;
    this.applyDefaults(initial.defaultDuration, this.toAmbientSound(initial.defaultSound));
    this.settingsSub = this.settingsService.settings$.subscribe((settings) => {
      this.warmupSeconds = settings.warmupSeconds;
      this.applyDefaults(settings.defaultDuration, this.toAmbientSound(settings.defaultSound));
    });
  }

  async selectSound(sound: AmbientSound): Promise<void> {
    await this.audioService.ensureContext();
    this.audioService.play(sound);
  }

  async previewSound(sound: AmbientSound): Promise<void> {
    this.previewBackup = this.audioService.currentSound;
    await this.audioService.ensureContext();
    this.audioService.play(sound);
    this.audioService.currentSound = this.previewBackup ?? 'silence';
  }

  stopPreview(): void {
    const prev = this.previewBackup;
    this.previewBackup = undefined;
    this.audioService.stopPreview();
    if (prev && prev !== 'silence') {
      this.audioService.play(prev);
    }
  }

  changeVolume(v: unknown): void {
    let value = 0;
    if (typeof v === 'number') {
      value = v;
    } else if (v && typeof v === 'object') {
      const range = v as { lower?: number; upper?: number };
      value = range.lower ?? range.upper ?? 0;
    }
    this.audioService.setVolume(Number(value));
  }

  mute(): void {
    this.audioService.setVolume(0);
  }

  get duration(): number {
    return this.timerService.duration$.value;
  }

  async start(): Promise<void> {
    await this.audioService.ensureContext();
    if (this.audioService.currentSound !== 'silence') {
      this.audioService.play(this.audioService.currentSound);
    }
    this.timerService.start(this.warmupSeconds);
  }

  pause(): void {
    this.timerService.pause();
  }

  resume(): void {
    this.timerService.resume();
  }

  stop(): void {
    this.timerService.stop();
    this.audioService.stop();
  }

  finishSession(): void {
    this.timerService.reset();
    this.audioService.stop();
  }

  changeDuration(value: number): void {
    this.timerService.setDuration(value);
  }

  changeDurationByDelta(delta: number): void {
    this.timerService.setDuration(this.duration + delta);
  }

  changeWarmup(seconds: number): void {
    this.warmupSeconds = seconds;
    void this.settingsService.update({ warmupSeconds: seconds });
  }

  warmupLabel(seconds: number): string {
    if (seconds === 0) return 'Aucun';
    return `${seconds} s`;
  }

  adjust(deltaMinutes: number): void {
    this.timerService.adjustMinutes(deltaMinutes);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.settingsSub?.unsubscribe();
  }

  private applyDefaults(defaultDuration: number, defaultSound: AmbientSound): void {
    if (this.status.state !== 'idle') {
      return;
    }
    if (this.duration !== defaultDuration) {
      this.timerService.setDuration(defaultDuration);
    }
    if (this.audioService.currentSound !== defaultSound) {
      this.audioService.currentSound = defaultSound;
    }
  }

  private async saveCompletedSession(status: TimerStatus): Promise<void> {
    const endTime = new Date();
    const fallbackStart = new Date(endTime.getTime() - status.totalSeconds * 1000).toISOString();
    await this.sessionService.add({
      startTime: this.currentSessionStart ?? fallbackStart,
      endTime: endTime.toISOString(),
      duration: status.totalSeconds,
      completed: true,
      sound: this.audioService.currentSound,
    });
  }

  private toAmbientSound(sound: string): AmbientSound {
    const allowed: AmbientSound[] = ['silence', 'brown-noise', 'white-noise', 'rain', 'ocean', 'wind'];
    return allowed.includes(sound as AmbientSound) ? (sound as AmbientSound) : 'silence';
  }
}
