import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonApp, IonFooter, IonIcon, IonRouterOutlet, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { home, informationCircle, list, settings, statsChart, time } from 'ionicons/icons';
import { SessionService } from './services/session.service';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-root',
  template: `
    <ion-app>
      <ion-router-outlet />
      <ion-footer>
        <ion-toolbar>
          <nav class="tab-bar" aria-label="Navigation principale">
            <a class="tab-link" routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
              <ion-icon name="home" aria-hidden="true" />
              <span>Accueil</span>
            </a>
            <a class="tab-link" routerLink="/timer" routerLinkActive="active">
              <ion-icon name="time" aria-hidden="true" />
              <span>Timer</span>
            </a>
            <a class="tab-link" routerLink="/history" routerLinkActive="active">
              <ion-icon name="list" aria-hidden="true" />
              <span>Historique</span>
            </a>
            <a class="tab-link" routerLink="/stats" routerLinkActive="active">
              <ion-icon name="stats-chart" aria-hidden="true" />
              <span>Stats</span>
            </a>
            <a class="tab-link" routerLink="/settings" routerLinkActive="active">
              <ion-icon name="settings" aria-hidden="true" />
              <span>Réglages</span>
            </a>
            <a class="tab-link" routerLink="/about" routerLinkActive="active">
              <ion-icon name="information-circle" aria-hidden="true" />
              <span>À propos</span>
            </a>
          </nav>
        </ion-toolbar>
      </ion-footer>
    </ion-app>
  `,
  styleUrl: './app.component.scss',
  imports: [IonApp, IonRouterOutlet, IonFooter, IonToolbar, IonIcon, RouterLink, RouterLinkActive],
  standalone: true,
})
export class AppComponent implements OnInit {
  constructor(
    private readonly sessionService: SessionService,
    private readonly settingsService: SettingsService,
  ) {
    addIcons({
      home,
      time,
      list,
      'stats-chart': statsChart,
      settings,
      'information-circle': informationCircle,
    });
  }

  ngOnInit(): void {
    void this.sessionService.load();
    void this.settingsService.load();
  }
}
