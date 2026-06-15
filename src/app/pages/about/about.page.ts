import { Component } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';

@Component({
  selector: 'app-about',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>À propos</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="page-stack">
        <p class="empty-state">
          Serene est une application de méditation minimaliste. Chronométrez vos sessions, choisissez une ambiance
          sonore et suivez votre pratique au fil du temps.
        </p>
      </div>
    </ion-content>
  `,
  imports: [IonContent, IonHeader, IonToolbar, IonTitle],
  standalone: true,
})
export class AboutPage {}
