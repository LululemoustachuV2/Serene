import { Component, Input } from '@angular/core';
import { TimerStatus } from '../../services/timer.service';

@Component({
  selector: 'app-timer-circle',
  template: `
    <div class="timer-circle">
      <svg viewBox="0 0 200 200" [attr.width]="size" [attr.height]="size" aria-hidden="true">
        <circle cx="100" cy="100" r="88" class="track" stroke-width="2" fill="none" />
        <circle
          cx="100"
          cy="100"
          r="88"
          class="progress"
          [class.progress--warmup]="status.isWarmup"
          [class.progress--infinite]="status.isInfinite"
          stroke-width="2"
          fill="none"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="dashOffset"
          stroke-linecap="round"
          transform="rotate(-90 100 100)"
        />
        <text x="100" y="94" class="value" text-anchor="middle" [attr.font-size]="valueFontSize">
          {{ pad(status.minutes) }}:{{ pad(status.seconds) }}
        </text>
        <text x="100" y="120" class="hint" text-anchor="middle" [attr.font-size]="hintFontSize">
          {{ hint }}
        </text>
      </svg>
    </div>
  `,
  styles: [
    `
      .timer-circle {
        display: flex;
        flex-direction: column;
        align-items: center;
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

      .progress--infinite {
        stroke-dashoffset: 0;
        opacity: 0.35;
      }

      .value {
        fill: var(--color-text);
        font-family: var(--font-mono);
        font-weight: 500;
        letter-spacing: -0.04em;
      }

      .hint {
        fill: var(--color-text-muted);
        font-family: var(--font-sans);
        font-weight: 500;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }
    `,
  ],
  standalone: true,
})
export class TimerCircleComponent {
  @Input() size = 200;
  @Input() status: TimerStatus = {
    remainingSeconds: 0,
    totalSeconds: 0,
    progress: 0,
    state: 'idle',
    minutes: 0,
    seconds: 0,
    isWarmup: false,
    isInfinite: false,
  };

  @Input() hint = '';

  readonly radius = 88;
  readonly circumference = 2 * Math.PI * this.radius;

  get valueFontSize(): number {
    return this.size * 0.14;
  }

  get hintFontSize(): number {
    return this.size * 0.055;
  }

  get dashOffset(): number {
    return this.circumference * (1 - (this.status?.progress ?? 1));
  }

  pad(n: number): string {
    return n.toString().padStart(2, '0');
  }
}
