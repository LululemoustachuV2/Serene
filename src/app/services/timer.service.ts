import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, Subscription, combineLatest, interval } from 'rxjs';
import { map } from 'rxjs/operators';

export type TimerState = 'idle' | 'preparing' | 'running' | 'paused' | 'completed';

export const INFINITE_DURATION = 0;

export interface TimerStatus {
  remainingSeconds: number;
  totalSeconds: number;
  progress: number;
  state: TimerState;
  minutes: number;
  seconds: number;
  estimatedEnd?: number;
  isWarmup: boolean;
  isInfinite: boolean;
}

@Injectable({ providedIn: 'root' })
export class TimerService {
  readonly duration$ = new BehaviorSubject<number>(10);
  readonly remaining$ = new BehaviorSubject<number>(0);
  readonly state$ = new BehaviorSubject<TimerState>('idle');

  private readonly meditationStartSubject = new Subject<void>();
  readonly onMeditationStart$ = this.meditationStartSubject.asObservable();

  private tickSubscription?: Subscription;
  private sessionTotalSeconds = 0;
  private warmupTotalSeconds = 0;
  private meditationStartTime?: string;

  readonly status$: Observable<TimerStatus> = combineLatest([
    this.remaining$,
    this.state$,
    this.duration$,
  ]).pipe(
    map(([remaining, state, duration]) => this.getStatus(remaining, state, duration)),
  );

  isInfiniteDuration(minutes = this.duration$.value): boolean {
    return minutes === INFINITE_DURATION;
  }

  getMeditationStartTime(): string | undefined {
    return this.meditationStartTime;
  }

  getElapsedSeconds(): number {
    return this.isInfiniteDuration() ? this.remaining$.value : 0;
  }

  setDuration(minutes: number): void {
    if (this.state$.value === 'idle') {
      this.duration$.next(Math.max(INFINITE_DURATION, Math.floor(minutes)));
    }
  }

  start(warmupSeconds = 10): void {
    if (this.state$.value !== 'idle') return;

    const infinite = this.isInfiniteDuration();
    this.sessionTotalSeconds = infinite ? 0 : this.duration$.value * 60;
    const warmup = Math.max(0, Math.floor(warmupSeconds));

    if (warmup <= 0) {
      this.warmupTotalSeconds = 0;
      this.remaining$.next(infinite ? 0 : this.sessionTotalSeconds);
      this.state$.next('running');
      this.beginMeditation();
      this.startTicking();
      return;
    }

    this.warmupTotalSeconds = warmup;
    this.remaining$.next(warmup);
    this.state$.next('preparing');
    this.startTicking();
  }

  pause(): void {
    if (this.state$.value === 'running') {
      this.state$.next('paused');
      this.stopTicking();
    }
  }

  resume(): void {
    if (this.state$.value === 'paused') {
      this.state$.next('running');
      this.startTicking();
    }
  }

  stop(): void {
    this.state$.next('idle');
    this.stopTicking();
    this.sessionTotalSeconds = 0;
    this.warmupTotalSeconds = 0;
    this.remaining$.next(0);
    this.meditationStartTime = undefined;
  }

  reset(): void {
    this.stop();
  }

  adjustMinutes(delta: number): void {
    if (this.isInfiniteDuration()) return;
    if (this.state$.value === 'running' || this.state$.value === 'paused') {
      const next = Math.max(0, this.remaining$.value + Math.floor(delta) * 60);
      this.remaining$.next(next);
    }
  }

  private beginMeditation(): void {
    if (!this.meditationStartTime) {
      this.meditationStartTime = new Date().toISOString();
      this.meditationStartSubject.next();
    }
  }

  private startTicking(): void {
    if (this.tickSubscription) return;
    this.tickSubscription = interval(1000).subscribe(() => this.onTick());
  }

  private onTick(): void {
    const state = this.state$.value;
    if (state !== 'preparing' && state !== 'running') return;

    const infinite = this.isInfiniteDuration();

    if (state === 'preparing') {
      const next = this.remaining$.value - 1;
      if (next <= 0) {
        this.remaining$.next(infinite ? 0 : this.sessionTotalSeconds);
        this.state$.next('running');
        this.beginMeditation();
        return;
      }
      this.remaining$.next(next);
      return;
    }

    if (infinite) {
      this.remaining$.next(this.remaining$.value + 1);
      return;
    }

    const next = this.remaining$.value - 1;
    if (next <= 0) {
      this.remaining$.next(0);
      this.state$.next('completed');
      this.stopTicking();
    } else {
      this.remaining$.next(next);
    }
  }

  private stopTicking(): void {
    this.tickSubscription?.unsubscribe();
    this.tickSubscription = undefined;
  }

  private getStatus(remainingRaw: number, state: TimerState, durationMinutes: number): TimerStatus {
    const infinite = durationMinutes === INFINITE_DURATION;
    const isWarmup = state === 'preparing';
    const remaining = Math.max(0, remainingRaw);

    if (infinite && !isWarmup && (state === 'running' || state === 'paused')) {
      return {
        remainingSeconds: remaining,
        totalSeconds: 0,
        progress: 1,
        state,
        minutes: Math.floor(remaining / 60),
        seconds: remaining % 60,
        isWarmup: false,
        isInfinite: true,
      };
    }

    const total = isWarmup
      ? this.warmupTotalSeconds
      : this.sessionTotalSeconds > 0
        ? this.sessionTotalSeconds
        : durationMinutes * 60;
    const isSessionActive = state === 'running' || state === 'paused';

    return {
      remainingSeconds: remaining,
      totalSeconds: total,
      progress: total > 0 ? remaining / total : 0,
      state,
      minutes: Math.floor(remaining / 60),
      seconds: remaining % 60,
      estimatedEnd: isSessionActive && !infinite ? Date.now() + remaining * 1000 : undefined,
      isWarmup,
      isInfinite: false,
    };
  }
}
