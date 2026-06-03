import { Component, OnDestroy } from '@angular/core';
import {
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
} from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { TimerService, TimerStatus } from '../../services/timer.service';
import { TimerCircleComponent } from '../../components/timer-circle/timer-circle.component';

@Component({
  selector: 'app-timer',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Minuteur</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <app-timer-circle [status]="status" [hint]="hint"></app-timer-circle>

      <div style="display:flex;gap:8px;justify-content:center;margin-top:12px">
        <ion-button *ngIf="status.state === 'idle'" (click)="start()" shape="round" size="large">
          <ion-icon slot="icon-only" name="play"></ion-icon>
        </ion-button>
        <ion-button *ngIf="status.state === 'running'" (click)="pause()" shape="round" size="large" fill="outline">
          <ion-icon slot="icon-only" name="pause"></ion-icon>
        </ion-button>
        <ng-container *ngIf="status.state === 'paused'">
          <ion-button (click)="resume()" shape="round" size="large">
            <ion-icon slot="icon-only" name="play"></ion-icon>
          </ion-button>
          <ion-button (click)="stop()" shape="round" size="large" fill="outline">
            <ion-icon slot="icon-only" name="stop"></ion-icon>
          </ion-button>
        </ng-container>
        <ion-button *ngIf="status.state === 'completed'" (click)="stop()" shape="round" size="large">
          Terminer
        </ion-button>
      </div>

      <div style="display:flex;gap:8px;justify-content:center;margin-top:8px">
        <ion-button (click)="changeDuration(-1)" [disabled]="status.state !== 'idle'">-1 min</ion-button>
        <ion-button (click)="changeDuration(1)" [disabled]="status.state !== 'idle'">+1 min</ion-button>
        <ion-button *ngIf="status.state==='running' || status.state==='paused'" (click)="adjust(-1)">-1 min</ion-button>
        <ion-button *ngIf="status.state==='running' || status.state==='paused'" (click)="adjust(1)">+1 min</ion-button>
      </div>

      <ion-list *ngIf="status.state === 'idle'">
        <ion-list-header>Durée</ion-list-header>
        <ion-item>
          <ion-label>Minutes</ion-label>
          <ion-select
            [value]="duration"
            (ionChange)="changeDuration($event.detail.value)"
            interface="popover"
          >
            <ion-select-option *ngFor="let m of minutesOptions" [value]="m">{{ m }}</ion-select-option>
          </ion-select>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
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
    TimerCircleComponent,
    CommonModule,
  ],
  standalone: true,
})
export class TimerPage implements OnDestroy {
  status: TimerStatus = {
    remainingSeconds: 0,
    totalSeconds: 0,
    progress: 0,
    state: 'idle',
    minutes: 0,
    seconds: 0,
    estimatedEnd: Date.now(),
  };
  hint = 'Prêt à méditer';

  minutesOptions = [5, 10, 15, 20, 25, 30, 45, 60];
  sub?: Subscription;

  constructor(readonly timerService: TimerService) {
    this.sub = this.timerService.status$.subscribe((s) => {
      this.status = s;
      this.hint = s.state === 'running' ? 'En cours' : s.state === 'completed' ? 'Session terminée' : 'Prêt à méditer';
    });
  }

  get duration(): number {
    return this.timerService.duration$.value;
  }

  start(): void {
    this.timerService.start();
  }

  pause(): void {
    this.timerService.pause();
  }

  resume(): void {
    this.timerService.resume();
  }

  stop(): void {
    this.timerService.stop();
  }

  changeDuration(value: number): void {
    this.timerService.setDuration(value);
  }

  adjust(deltaMinutes: number): void {
    this.timerService.adjustMinutes(deltaMinutes);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}

