import { Component } from '@angular/core';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NavbarComponent } from '../../shared/navbar/navbar.component';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgIf,
    RouterLink,
    NavbarComponent
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  resetEmail = '';
  resetMessage = '';
  showResetPassword = false;

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    this.authService.login(this.email, this.password)
      .then(() => {
        this.router.navigate(['/dashboard']); // Redirect to dashboard
      })
      .catch(err => this.error = err.message);
  }

  onLoginWithGoogle() {
    this.authService.loginWithGoogle()
      .then(() => {
        this.router.navigate(['/dashboard']); // Redirect to dashboard
      })
      .catch(err => this.error = err.message);
  }

  onResetPassword() {
    this.authService.resetPassword(this.resetEmail)
      .then(() => this.resetMessage = 'Email de réinitialisation envoyé.')
      .catch(err => this.error = err.message);
  }
  
}
