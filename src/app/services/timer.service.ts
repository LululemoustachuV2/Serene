import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, combineLatest, interval } from 'rxjs';
import { map } from 'rxjs/operators';

export type TimerState = 'idle' | 'preparing' | 'running' | 'paused' | 'completed';

export interface TimerStatus {
  remainingSeconds: number;
  totalSeconds: number;
  progress: number;
  state: TimerState;
  minutes: number;
  seconds: number;
  estimatedEnd?: number;
  isWarmup: boolean;
}

@Injectable({ providedIn: 'root' })
export class TimerService {
  readonly duration$ = new BehaviorSubject<number>(10);
  readonly remaining$ = new BehaviorSubject<number>(0);
  readonly state$ = new BehaviorSubject<TimerState>('idle');

  private tickSubscription?: Subscription;
  private sessionTotalSeconds = 0;
  private warmupTotalSeconds = 0;

  readonly status$: Observable<TimerStatus> = combineLatest([
    this.remaining$,
    this.state$,
    this.duration$,
  ]).pipe(
    map(([remaining, state, duration]) => this.getStatus(remaining, state, duration)),
  );

  setDuration(minutes: number): void {
    if (this.state$.value === 'idle') {
      this.duration$.next(Math.max(1, Math.floor(minutes)));
    }
  }

  start(warmupSeconds = 10): void {
    if (this.state$.value !== 'idle') return;

    this.sessionTotalSeconds = this.duration$.value * 60;
    const warmup = Math.max(0, Math.floor(warmupSeconds));

    if (warmup <= 0) {
      this.warmupTotalSeconds = 0;
      this.remaining$.next(this.sessionTotalSeconds);
      this.state$.next('running');
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
  }

  reset(): void {
    this.stop();
  }

  adjustMinutes(delta: number): void {
    if (this.state$.value === 'running' || this.state$.value === 'paused') {
      const next = Math.max(0, this.remaining$.value + Math.floor(delta) * 60);
      this.remaining$.next(next);
    }
  }

  private startTicking(): void {
    if (this.tickSubscription) return;
    this.tickSubscription = interval(1000).subscribe(() => this.onTick());
  }

  private onTick(): void {
    const state = this.state$.value;
    if (state !== 'preparing' && state !== 'running') return;

    const next = this.remaining$.value - 1;

    if (state === 'preparing') {
      if (next <= 0) {
        this.remaining$.next(this.sessionTotalSeconds);
        this.state$.next('running');
        return;
      }
      this.remaining$.next(next);
      return;
    }

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
    const remaining = Math.max(0, remainingRaw);
    const isWarmup = state === 'preparing';
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
      estimatedEnd: isSessionActive ? Date.now() + remaining * 1000 : undefined,
      isWarmup,
    };
  }
}
