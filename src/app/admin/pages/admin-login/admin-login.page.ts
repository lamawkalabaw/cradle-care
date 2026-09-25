import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AdminAuthService } from '../../../services/admin-auth.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <ion-content class="ion-padding">
      <div class="login-wrapper">
        <h1>Admin Login</h1>
        <p>Sign in with your admin account</p>

        <ion-item>
          <ion-label position="stacked">Email</ion-label>
          <ion-input
            type="email"
            [(ngModel)]="email"
            [disabled]="loading()"
            autocomplete="email"
          ></ion-input>
        </ion-item>

        <ion-item>
          <ion-label position="stacked">Password</ion-label>
          <ion-input
            type="password"
            [(ngModel)]="password"
            [disabled]="loading()"
            autocomplete="current-password"
          ></ion-input>
        </ion-item>

        @if (errorMessage()) {
          <p class="error">{{ errorMessage() }}</p>
        }

        <ion-button
          expand="block"
          class="ion-margin-top"
          [disabled]="loading() || !email || !password"
          (click)="onLogin()"
        >
          {{ loading() ? 'Signing in...' : 'Sign In' }}
        </ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .login-wrapper {
      max-width: 400px;
      margin: 60px auto 0;
    }
    .error {
      color: var(--ion-color-danger, #eb445a);
      margin-top: 12px;
      font-size: 14px;
    }
  `]
})
export class AdminLoginPage {
  private authService = inject(AdminAuthService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);
  errorMessage = signal('');

  async onLogin(): Promise<void> {
    this.errorMessage.set('');
    this.loading.set(true);

    const result = await this.authService.login(this.email, this.password);

    this.loading.set(false);

    if (result.ok) {
      this.router.navigate(['/admin']);
    } else {
      this.errorMessage.set(result.message ?? 'Login failed. Please try again.');
    }
  }
}
