import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, interval } from 'rxjs';
import { map } from 'rxjs/operators';

export type TimerState = 'idle' | 'running' | 'paused' | 'completed';

export interface TimerStatus {
  remainingSeconds: number;
  totalSeconds: number;
  progress: number;
  state: TimerState;
  minutes: number;
  seconds: number;
  estimatedEnd?: number; // timestamp in ms
}

@Injectable({ providedIn: 'root' })
export class TimerService {
  readonly duration$ = new BehaviorSubject<number>(10); // minutes
  readonly remaining$ = new BehaviorSubject<number>(0); // seconds
  readonly state$ = new BehaviorSubject<TimerState>('idle');

  private tickSubscription?: Subscription;

  readonly status$: Observable<TimerStatus> = this.remaining$.pipe(
    map(() => this.getStatus()),
  );

  setDuration(minutes: number): void {
    if (this.state$.value === 'idle') {
      this.duration$.next(Math.max(1, Math.floor(minutes)));
    }
  }

  start(): void {
    const total = this.duration$.value * 60;
    if (this.state$.value === 'idle') {
      this.remaining$.next(total);
    }
    this.state$.next('running');
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
    this.remaining$.next(0);
  }

  /** Adjust the remaining time by minutes during a session (running or paused) */
  adjustMinutes(delta: number): void {
    if (this.state$.value === 'running' || this.state$.value === 'paused') {
      const next = Math.max(0, this.remaining$.value + Math.floor(delta) * 60);
      this.remaining$.next(next);
      // Optionally keep duration in sync when user explicitly changes minutes
      this.duration$.next(Math.max(1, Math.ceil((this.remaining$.value) / 60)));
    }
  }

  private startTicking(): void {
    if (this.tickSubscription) return;
    this.tickSubscription = interval(1000).subscribe(() => {
      if (this.state$.value !== 'running') return;
      const next = this.remaining$.value - 1;
      if (next <= 0) {
        this.remaining$.next(0);
        this.state$.next('completed');
        this.stopTicking();
        this.playSound();
      } else {
        this.remaining$.next(next);
      }
    });
  }

  private stopTicking(): void {
    this.tickSubscription?.unsubscribe();
    this.tickSubscription = undefined;
  }

  private getStatus(): TimerStatus {
    const total = this.duration$.value * 60;
    const remaining = Math.max(0, this.remaining$.value);
    const now = Date.now();
    return {
      remainingSeconds: remaining,
      totalSeconds: total,
      progress: total > 0 ? remaining / total : 0,
      state: this.state$.value,
      minutes: Math.floor(remaining / 60),
      seconds: remaining % 60,
      estimatedEnd: remaining > 0 ? now + remaining * 1000 : now,
    };
  }

  private playSound(): void {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880;
      g.gain.value = 0.1;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      setTimeout(() => {
        o.stop();
        ctx.close();
      }, 150);
    } catch (e) {
      // ignore if audio is not available
    }
  }
}
