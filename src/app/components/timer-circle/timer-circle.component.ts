import { Component, Input } from '@angular/core';
import { TimerStatus } from '../../services/timer.service';

@Component({
  selector: 'app-timer-circle',
  template: `
    <div class="timer-circle">
      <svg viewBox="0 0 200 200" width="220" height="220" aria-hidden="true">
        <circle cx="100" cy="100" r="88" class="track" stroke-width="2" fill="none" />
        <circle
          cx="100"
          cy="100"
          r="88"
          class="progress"
          [class.progress--warmup]="status.isWarmup"
          stroke-width="2"
          fill="none"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="dashOffset"
          stroke-linecap="round"
          transform="rotate(-90 100 100)"
        />
        <text x="100" y="92" class="value" text-anchor="middle">
          {{ pad(status.minutes) }}:{{ pad(status.seconds) }}
        </text>
        <text x="100" y="118" class="hint" text-anchor="middle">
          {{ hint }}
        </text>
      </svg>
      @if (status.state === 'running' || status.state === 'paused') {
        <p class="estimated-end">Fin estimée · {{ formatEnd(status.estimatedEnd) }}</p>
      }
    </div>
  `,
  styles: [
    `
      .timer-circle {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--space-3);
      }

      .track {
        stroke: var(--color-border);
      }

      .progress {
        stroke: var(--color-text);
        transition: stroke-dashoffset var(--duration-normal) var(--ease-default);
      }

      .progress--warmup {
        stroke: var(--color-text-muted);
      }

      .value {
        fill: var(--color-text);
        font-family: var(--font-mono);
        font-size: 2rem;
        font-weight: 500;
        letter-spacing: -0.04em;
      }

      .hint {
        fill: var(--color-text-muted);
        font-family: var(--font-sans);
        font-size: 0.75rem;
        font-weight: 500;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      .estimated-end {
        margin: 0;
        color: var(--color-text-muted);
        font-family: var(--font-sans);
        font-size: 0.8125rem;
        letter-spacing: 0.02em;
      }
    `,
  ],
  standalone: true,
})
export class TimerCircleComponent {
  @Input() status: TimerStatus = {
    remainingSeconds: 0,
    totalSeconds: 0,
    progress: 0,
    state: 'idle',
    minutes: 0,
    seconds: 0,
    isWarmup: false,
  };

  @Input() hint = '';

  readonly radius = 88;
  readonly circumference = 2 * Math.PI * this.radius;

  get dashOffset(): number {
    return this.circumference * (1 - (this.status?.progress ?? 1));
  }

  pad(n: number): string {
    return n.toString().padStart(2, '0');
  }

  formatEnd(ts?: number): string {
    if (!ts) return '';
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  }
}
