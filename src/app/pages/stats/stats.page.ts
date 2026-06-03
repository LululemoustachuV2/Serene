import { Component } from '@angular/core';
import { IonContent, IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';

@Component({
  selector: 'app-stats',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Statistiques</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>Statistiques</p>
    </ion-content>
  `,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle],
  standalone: true,
})
export class StatsPage {}
