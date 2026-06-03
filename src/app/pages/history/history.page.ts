import { Component } from '@angular/core';
import { IonContent, IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';

@Component({
  selector: 'app-history',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Historique</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>Historique</p>
    </ion-content>
  `,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle],
  standalone: true,
})
export class HistoryPage {}
