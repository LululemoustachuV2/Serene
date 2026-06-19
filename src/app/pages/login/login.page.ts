import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonList,
  IonSpinner,
  IonText,
} from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth.service';
import { SessionService } from '../../services/session.service';

@Component({
  selector: 'app-login',
  template: `
    <ion-content class="login-content">
      <div class="login-page">
        <header class="login-header">
          <h1>Serene</h1>
          <p>Connectez-vous pour retrouver votre parcours.</p>
        </header>

        <form [formGroup]="form" (ngSubmit)="submit()">
          <ion-list>
            <ion-item>
              <ion-input
                label="Email"
                labelPlacement="stacked"
                type="email"
                formControlName="email"
                autocomplete="email"
              />
            </ion-item>
            <ion-item>
              <ion-input
                label="Mot de passe"
                labelPlacement="stacked"
                type="password"
                formControlName="password"
                autocomplete="current-password"
              />
            </ion-item>
          </ion-list>

          @if (errorMessage) {
            <ion-text color="danger" class="login-error">{{ errorMessage }}</ion-text>
          }

          <ion-button expand="block" type="submit" [disabled]="form.invalid || loading">
            @if (loading) {
              <ion-spinner name="crescent" />
            } @else {
              Se connecter
            }
          </ion-button>
        </form>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .login-content {
        --padding-top: var(--space-10);
        --padding-start: var(--space-4);
        --padding-end: var(--space-4);
      }

      .login-page {
        max-width: 400px;
        margin: 0 auto;
      }

      .login-header {
        margin-bottom: var(--space-8);
        text-align: center;

        h1 {
          margin: 0 0 var(--space-2);
          font-size: 2rem;
        }

        p {
          margin: 0;
          color: var(--color-text-secondary);
          font-size: 0.9375rem;
        }
      }

      ion-list {
        margin-bottom: var(--space-4);
      }

      .login-error {
        display: block;
        margin-bottom: var(--space-4);
        font-size: 0.875rem;
      }

      ion-button {
        margin-top: var(--space-2);
      }
    `,
  ],
  imports: [
    IonContent,
    IonList,
    IonItem,
    IonInput,
    IonButton,
    IonText,
    IonSpinner,
    ReactiveFormsModule,
  ],
  standalone: true,
})
export class LoginPage {
  loading = false;
  errorMessage = '';

  readonly form: ReturnType<FormBuilder['group']>;

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    private readonly sessions: SessionService,
    private readonly router: Router,
  ) {
    this.form = this.fb.nonNullable.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });
  }

  async submit(): Promise<void> {
    if (this.form.invalid) return;

    this.loading = true;
    this.errorMessage = '';

    try {
      const { email, password } = this.form.getRawValue();
      await this.auth.login(email, password);
      await this.sessions.load();
      await this.router.navigateByUrl('/mediter');
    } catch (err) {
      this.errorMessage = err instanceof Error ? err.message : 'Connexion impossible';
    } finally {
      this.loading = false;
    }
  }
}
