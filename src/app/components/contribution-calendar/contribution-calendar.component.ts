import { Component, Input, OnInit } from '@angular/core';
import { localDateKey } from '../../utils/date.utils';

export interface CalendarDay {
  date: string;
  practiced: boolean;
  label: string;
}

@Component({
  selector: 'app-contribution-calendar',
  template: `
    <div class="calendar" role="img" [attr.aria-label]="ariaLabel">
      <div class="calendar-body">
        <div class="calendar-weekdays" aria-hidden="true">
          @for (d of weekdays; track d) {
            <span class="weekday">{{ d }}</span>
          }
        </div>
        <div class="calendar-grid">
          @for (week of weeks; track $index) {
            <div class="calendar-week">
              @for (day of week; track day.date) {
                <span
                  class="calendar-day"
                  [class.calendar-day--active]="day.practiced"
                  [class.calendar-day--empty]="!day.date"
                  [attr.title]="day.label || null"
                ></span>
              }
            </div>
          }
        </div>
      </div>
      <p class="calendar-legend">
        <span class="calendar-day calendar-day--sample"></span>
        Jour de pratique
      </p>
    </div>
  `,
  styles: [
    `
      .calendar {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .calendar-body {
        display: flex;
        gap: var(--space-2);
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        padding-bottom: var(--space-1);
      }

      .calendar-weekdays {
        display: flex;
        flex-direction: column;
        gap: 3px;
        padding-top: 0;
        flex-shrink: 0;
      }

      .weekday {
        font-size: 0.625rem;
        color: var(--color-text-muted);
        height: 12px;
        line-height: 12px;
      }

      .calendar-grid {
        display: flex;
        gap: 3px;
      }

      .calendar-week {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .calendar-day {
        width: 12px;
        height: 12px;
        border-radius: 2px;
        border: 1px solid var(--color-border);
        background: transparent;
        flex-shrink: 0;
      }

      .calendar-day--active,
      .calendar-day--sample {
        background: var(--color-text);
        border-color: var(--color-text);
      }

      .calendar-day--empty {
        visibility: hidden;
      }

      .calendar-legend {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin: var(--space-2) 0 0;
        font-size: 0.75rem;
        color: var(--color-text-muted);
      }

      .calendar-day--sample {
        width: 12px;
        height: 12px;
      }
    `,
  ],
  standalone: true,
})
export class ContributionCalendarComponent implements OnInit {
  private practicedDates = new Set<string>();

  @Input() set practicedDateKeys(keys: readonly string[]) {
    this.practicedDates = new Set(keys);
    this.rebuild();
  }

  weeks: CalendarDay[][] = [];
  readonly weekdays = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  ariaLabel = 'Calendrier de pratique';

  ngOnInit(): void {
    this.rebuild();
  }

  private rebuild(): void {
    this.weeks = this.buildWeeks();
    const count = this.practicedDates.size;
    this.ariaLabel = `${count} jour${count > 1 ? 's' : ''} de pratique sur les 26 dernières semaines`;
  }

  private buildWeeks(): CalendarDay[][] {
    const weeks: CalendarDay[][] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(today);
    start.setDate(start.getDate() - 26 * 7);
    const dayOfWeek = start.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    start.setDate(start.getDate() + mondayOffset);

    const cursor = new Date(start);
    let currentWeek: CalendarDay[] = [];

    while (cursor <= today) {
      const key = localDateKey(cursor);
      currentWeek.push({
        date: key,
        practiced: this.practicedDates.has(key),
        label: cursor.toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        }),
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      cursor.setDate(cursor.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push({ date: '', practiced: false, label: '' });
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }
}
