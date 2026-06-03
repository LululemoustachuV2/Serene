import { Component } from '@angular/core';
import { IonContent, IonHeader, IonToolbar, IonTitle } from '@ionic/angular/standalone';

@Component({
  selector: 'app-about',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>À propos</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>À propos</p>
    </ion-content>
  `,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle],
  standalone: true,
})
export class AboutPage {}
