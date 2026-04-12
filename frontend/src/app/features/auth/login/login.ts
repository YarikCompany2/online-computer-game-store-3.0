import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html'
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  identifier = signal('');
  password = signal('');
  
  error = signal<string | null>(null);
  isLoading = signal(false);

  isFormValid = computed(() => 
    this.identifier().trim().length > 0 && 
    this.password().length >= 8
  );

  onSubmit() {
    if (!this.isFormValid()) return;

    this.isLoading.set(true);
    this.error.set(null);

    this.authService.login({ 
      identifier: this.identifier(), 
      password: this.password() 
    }).subscribe({
      next: () => {
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error.set(err.error.message || 'Login failed');
        this.isLoading.set(false);
      }
    });
  }
}
