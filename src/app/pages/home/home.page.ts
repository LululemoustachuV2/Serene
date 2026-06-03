import { Component } from '@angular/core';
import { IonContent, IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';

@Component({
  selector: 'app-home',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Serene</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>Accueil</p>
    </ion-content>
  `,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle],
  standalone: true,
})
export class HomePage {}
