import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';
import { IonApp, IonFooter, IonIcon, IonRouterOutlet, IonToolbar } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { calendarOutline, flowerOutline, settingsOutline } from 'ionicons/icons';
import { AuthService } from './services/auth.service';
import { SessionService } from './services/session.service';
import { SettingsService } from './services/settings.service';

@Component({
  selector: 'app-root',
  template: `
    <ion-app>
      <ion-router-outlet />
      @if (showNav) {
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
      }
    </ion-app>
  `,
  styleUrl: './app.component.scss',
  imports: [IonApp, IonRouterOutlet, IonFooter, IonToolbar, IonIcon, RouterLink, RouterLinkActive],
  standalone: true,
})
export class AppComponent implements OnInit, OnDestroy {
  showNav = false;

  private routerSub?: Subscription;

  constructor(
    private readonly authService: AuthService,
    private readonly sessionService: SessionService,
    private readonly settingsService: SettingsService,
    private readonly router: Router,
  ) {
    addIcons({
      'calendar-outline': calendarOutline,
      'flower-outline': flowerOutline,
      'settings-outline': settingsOutline,
    });
  }

  ngOnInit(): void {
    this.updateNav(this.router.url);
    this.routerSub = this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => this.updateNav((e as NavigationEnd).urlAfterRedirects));

    void this.authService.init().then(() => {
      if (this.authService.isAuthenticated()) {
        void this.sessionService.load();
      }
      this.updateNav(this.router.url);
    });

    this.authService.user$.subscribe(() => {
      this.updateNav(this.router.url);
    });

    void this.settingsService.load().then(() => {
      const theme = this.settingsService.settings$.value.theme;
      document.documentElement.classList.toggle('dark', theme === 'dark');
    });
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  private updateNav(url: string): void {
    this.showNav = this.authService.isAuthenticated() && !url.startsWith('/login');
  }
}
