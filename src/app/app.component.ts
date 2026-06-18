import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonApp, IonFooter, IonIcon, IonRouterOutlet, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, flowerOutline, settingsOutline } from 'ionicons/icons';
import { SessionService } from './services/session.service';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-root',
  template: `
    <ion-app>
      <ion-router-outlet />
      <ion-footer class="tab-footer">
        <ion-toolbar>
          <nav class="tab-bar" aria-label="Navigation principale">
            <a
              class="tab-link"
              routerLink="/parcours"
              routerLinkActive="active"
              aria-label="Parcours"
            >
              <ion-icon name="calendar-outline" aria-hidden="true" />
              <span>Parcours</span>
            </a>

            <a
              class="tab-link tab-link--center"
              routerLink="/mediter"
              routerLinkActive="active"
              aria-label="Méditer"
            >
              <ion-icon name="flower-outline" aria-hidden="true" />
              <span class="tab-link__label">Méditer</span>
            </a>

            <a
              class="tab-link"
              routerLink="/settings"
              routerLinkActive="active"
              aria-label="Réglages"
            >
              <ion-icon name="settings-outline" aria-hidden="true" />
              <span>Réglages</span>
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
      'calendar-outline': calendarOutline,
      'flower-outline': flowerOutline,
      'settings-outline': settingsOutline,
    });
  }

  ngOnInit(): void {
    void this.sessionService.load();
    void this.settingsService.load().then(() => {
      const theme = this.settingsService.settings$.value.theme;
      document.documentElement.classList.toggle('dark', theme === 'dark');
    });
  }
}
