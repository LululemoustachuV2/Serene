import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonRange,
  IonSelect,
  IonSelectOption,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { musicalNotes, pause, play, stop } from 'ionicons/icons';
import { Subscription } from 'rxjs';
import { SoundPickerComponent } from '../../components/sound-picker/sound-picker.component';
import { TimerCircleComponent } from '../../components/timer-circle/timer-circle.component';
import { AudioService, AmbientSound } from '../../services/audio.service';
import { SessionService } from '../../services/session.service';
import { SettingsService } from '../../services/settings.service';
import { INFINITE_DURATION, TimerService, TimerStatus } from '../../services/timer.service';

@Component({
  selector: 'app-timer',
  template: `
    <ion-content [scrollY]="false" [fullscreen]="true" class="meditate-content">
      <div class="meditate-page">
        <div class="meditate-top">
          <app-timer-circle [status]="status" [hint]="hint" [size]="200" />

          <div class="controls">
            @if (status.state === 'idle') {
              <ion-button class="control-btn" (click)="start()" shape="round" size="default">
                <ion-icon slot="icon-only" name="play" />
              </ion-button>
            }
            @if (status.state === 'preparing') {
              <ion-button class="control-btn" (click)="stop()" shape="round" size="default" fill="outline">
                <ion-icon slot="icon-only" name="stop" />
              </ion-button>
            }
            @if (status.state === 'running') {
              <ion-button class="control-btn" (click)="pause()" shape="round" size="default" fill="outline">
                <ion-icon slot="icon-only" name="pause" />
              </ion-button>
              @if (status.isInfinite) {
                <ion-button class="control-btn control-btn--text" (click)="stop()" shape="round" size="default">
                  Terminer
                </ion-button>
              }
            }
            @if (status.state === 'paused') {
              <ion-button class="control-btn" (click)="resume()" shape="round" size="default">
                <ion-icon slot="icon-only" name="play" />
              </ion-button>
              <ion-button class="control-btn" (click)="stop()" shape="round" size="default" fill="outline">
                <ion-icon slot="icon-only" name="stop" />
              </ion-button>
            }
            @if (status.state === 'completed') {
              <ion-button class="control-btn control-btn--text" (click)="finishSession()" shape="round" size="default">
                Terminer
              </ion-button>
            }
          </div>
        </div>

        <div class="meditate-bottom">
          @if (status.state === 'idle') {
            <div class="config-row">
              <div class="config-field">
                <span class="config-label">Durée</span>
                <ion-select
                  [value]="duration"
                  (ionChange)="changeDuration($event.detail.value)"
                  interface="action-sheet"
                  aria-label="Durée"
                >
                  <ion-select-option [value]="infiniteDuration">Infini</ion-select-option>
                  @for (m of minutesOptions; track m) {
                    <ion-select-option [value]="m">{{ m }} min</ion-select-option>
                  }
                </ion-select>
              </div>
              <div class="config-field">
                <span class="config-label">Installation</span>
                <ion-select
                  [value]="warmupSeconds"
                  (ionChange)="changeWarmup($event.detail.value)"
                  interface="action-sheet"
                  aria-label="Temps d'installation"
                >
                  @for (w of warmupOptions; track w) {
                    <ion-select-option [value]="w">{{ warmupLabel(w) }}</ion-select-option>
                  }
                </ion-select>
              </div>
            </div>
          }

          <app-sound-picker
            [compact]="true"
            [active]="audioService.currentSound"
            (select)="selectSound($event)"
          />

          <div class="volume-row">
            <ion-icon name="musical-notes" aria-hidden="true" />
            <ion-range
              class="volume-range"
              [value]="audioService.volume"
              (ionChange)="changeVolume($event.detail.value)"
              min="0"
              max="1"
              step="0.05"
              aria-label="Volume"
            />
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styleUrl: './timer.page.scss',
  imports: [
    IonContent,
    IonButton,
    IonIcon,
    IonSelect,
    IonSelectOption,
    IonRange,
    SoundPickerComponent,
    TimerCircleComponent,
  ],
  standalone: true,
})
export class TimerPage implements OnInit, OnDestroy {
  readonly infiniteDuration = INFINITE_DURATION;

  status: TimerStatus = {
    remainingSeconds: 0,
    totalSeconds: 0,
    progress: 0,
    state: 'idle',
    minutes: 0,
    seconds: 0,
    isWarmup: false,
    isInfinite: false,
  };
  hint = 'Prêt à méditer';
  minutesOptions = [5, 10, 15, 20, 25, 30, 45, 60];
  warmupOptions = [0, 5, 10, 15, 20, 30];
  warmupSeconds = 10;

  private sub?: Subscription;
  private settingsSub?: Subscription;
  private meditationStartSub?: Subscription;
  private completionSaved = false;
  private statusSynced = false;
  private previousState: TimerStatus['state'] = 'idle';
  private previousRemaining?: number;
  private intervalMinutes = 1;
  private ambientPlaying = false;

  constructor(
    readonly timerService: TimerService,
    readonly audioService: AudioService,
    private readonly sessionService: SessionService,
    private readonly settingsService: SettingsService,
  ) {
    addIcons({ play, pause, stop, 'musical-notes': musicalNotes });

    this.meditationStartSub = this.timerService.onMeditationStart$.subscribe(() => {
      this.audioService.playGong();
    });

    this.sub = this.timerService.status$.subscribe((s) => {
      const prevState = this.statusSynced ? this.previousState : s.state;
      const prevRemaining = this.statusSynced ? this.previousRemaining : s.remainingSeconds;

      this.status = s;
      this.hint = this.buildHint(s);

      if (s.isInfinite && s.state === 'running' && !s.isWarmup) {
        if (
          this.intervalMinutes > 0 &&
          s.remainingSeconds > 0 &&
          prevRemaining === s.remainingSeconds - 1 &&
          s.remainingSeconds % (this.intervalMinutes * 60) === 0
        ) {
          this.audioService.playIntervalGong();
        }
      } else if (
        s.state === 'running' &&
        !s.isWarmup &&
        !s.isInfinite &&
        this.intervalMinutes > 0 &&
        s.remainingSeconds > 0 &&
        prevRemaining === s.remainingSeconds + 1 &&
        s.remainingSeconds % (this.intervalMinutes * 60) === 0
      ) {
        this.audioService.playIntervalGong();
      }

      if (s.state === 'completed' && prevState !== 'completed' && !this.completionSaved) {
        this.completionSaved = true;
        void this.saveCompletedSession(s);
        this.audioService.playBell();
        this.stopAmbient();
      }

      if (s.state === 'idle') {
        this.completionSaved = false;
        this.previousRemaining = undefined;
        this.stopAmbient();
      } else if (s.state === 'running' && !s.isWarmup) {
        this.previousRemaining = s.remainingSeconds;
      } else if (s.state !== 'paused') {
        this.previousRemaining = undefined;
      }

      this.previousState = s.state;
      this.statusSynced = true;
    });
  }

  ngOnInit(): void {
    const initial = this.settingsService.settings$.value;
    this.warmupSeconds = initial.warmupSeconds;
    this.intervalMinutes = initial.intervalMinutes || 1;
    this.applyDefaults(initial.defaultDuration, this.toAmbientSound(initial.defaultSound));
    this.settingsSub = this.settingsService.settings$.subscribe((settings) => {
      this.warmupSeconds = settings.warmupSeconds;
      this.intervalMinutes = settings.intervalMinutes || 1;
      this.applyDefaults(settings.defaultDuration, this.toAmbientSound(settings.defaultSound));
    });
  }

  async selectSound(sound: AmbientSound): Promise<void> {
    await this.audioService.ensureContext();
    if (this.isSessionActive()) {
      this.audioService.play(sound);
      this.ambientPlaying = sound !== 'silence';
    } else {
      this.audioService.currentSound = sound;
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

  get duration(): number {
    return this.timerService.duration$.value;
  }

  async start(): Promise<void> {
    await this.audioService.ensureContext();
    this.startAmbient();
    this.timerService.start(this.warmupSeconds);
  }

  pause(): void {
    this.timerService.pause();
  }

  resume(): void {
    this.timerService.resume();
  }

  stop(): void {
    if (this.status.isInfinite && this.isSessionActive()) {
      void this.saveInfiniteSession();
    }
    this.timerService.stop();
    this.stopAmbient();
  }

  finishSession(): void {
    this.timerService.reset();
    this.stopAmbient();
  }

  changeDuration(value: number): void {
    this.timerService.setDuration(value);
  }

  changeWarmup(seconds: number): void {
    this.warmupSeconds = seconds;
    void this.settingsService.update({ warmupSeconds: seconds });
  }

  warmupLabel(seconds: number): string {
    if (seconds === 0) return 'Aucun';
    return `${seconds} s`;
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.settingsSub?.unsubscribe();
    this.meditationStartSub?.unsubscribe();
  }

  private buildHint(s: TimerStatus): string {
    if (s.state === 'preparing') return 'Installez-vous';
    if (s.state === 'running') return s.isInfinite ? 'Sans limite' : 'En cours';
    if (s.state === 'completed') return 'Session terminée';
    return 'Prêt à méditer';
  }

  private isSessionActive(): boolean {
    return ['preparing', 'running', 'paused'].includes(this.status.state);
  }

  private async startAmbient(): Promise<void> {
    const sound = this.audioService.currentSound;
    if (sound !== 'silence') {
      this.audioService.play(sound);
      this.ambientPlaying = true;
    }
  }

  private stopAmbient(): void {
    if (this.ambientPlaying) {
      this.audioService.halt();
      this.ambientPlaying = false;
    }
  }

  private applyDefaults(defaultDuration: number, defaultSound: AmbientSound): void {
    if (this.status.state !== 'idle') return;
    if (this.duration !== defaultDuration) {
      this.timerService.setDuration(defaultDuration);
    }
    if (!this.isSessionActive() && this.audioService.currentSound !== defaultSound) {
      this.audioService.currentSound = defaultSound;
    }
  }

  private async saveCompletedSession(status: TimerStatus): Promise<void> {
    const endTime = new Date();
    const startTime =
      this.timerService.getMeditationStartTime() ??
      new Date(endTime.getTime() - status.totalSeconds * 1000).toISOString();
    await this.sessionService.add({
      startTime,
      endTime: endTime.toISOString(),
      duration: status.totalSeconds,
      completed: true,
      sound: this.audioService.currentSound,
    });
  }

  private async saveInfiniteSession(): Promise<void> {
    const elapsed = this.timerService.getElapsedSeconds();
    if (elapsed < 1) return;

    const endTime = new Date();
    const startTime =
      this.timerService.getMeditationStartTime() ??
      new Date(endTime.getTime() - elapsed * 1000).toISOString();
    await this.sessionService.add({
      startTime,
      endTime: endTime.toISOString(),
      duration: elapsed,
      completed: true,
      sound: this.audioService.currentSound,
    });
  }

  private toAmbientSound(sound: string): AmbientSound {
    const allowed: AmbientSound[] = ['silence', 'brown-noise', 'white-noise', 'rain', 'ocean', 'wind'];
    return allowed.includes(sound as AmbientSound) ? (sound as AmbientSound) : 'silence';
  }
}
