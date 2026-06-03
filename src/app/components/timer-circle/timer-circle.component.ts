import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TimerStatus } from '../../services/timer.service';

@Component({
  selector: 'app-timer-circle',
  template: `
    <div style="display:flex;flex-direction:column;align-items:center">
      <svg viewBox="0 0 200 200" width="200" height="200">
        <circle cx="100" cy="100" r="90" class="track" stroke="#eee" stroke-width="12" fill="none" />
        <circle
          cx="100" cy="100" r="90"
          class="progress"
          stroke="#2dd36f"
          stroke-width="12"
          fill="none"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="dashOffset"
          stroke-linecap="round"
          transform="rotate(-90 100 100)"
        />
        <text x="100" y="95" class="value" text-anchor="middle" font-size="28" fill="#222">
          {{ pad(status.minutes) }}:{{ pad(status.seconds) }}
        </text>
        <text x="100" y="125" class="hint" text-anchor="middle" font-size="12" fill="#666">
          {{ hint }}
        </text>
      </svg>
      <div style="margin-top:8px;color:#666;font-size:14px">
        <span *ngIf="status.state !== 'idle'">Fin estimée : {{ formatEnd(status.estimatedEnd) }}</span>
      </div>
    </div>
  `,
  standalone: true,
  imports: [CommonModule],
})
export class TimerCircleComponent {
  @Input() status: TimerStatus = {
    remainingSeconds: 0,
    totalSeconds: 0,
    progress: 0,
    state: 'idle',
    minutes: 0,
    seconds: 0,
    estimatedEnd: Date.now(),
  };

  @Input() hint = '';

  readonly radius = 90;
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
