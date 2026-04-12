import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html'
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  username = signal('');
  email = signal('');
  password = signal('');
  confirmPassword = signal('');
  
  error = signal<string | null>(null);
  isLoading = signal(false);

  passwordsMatch = computed(() => 
    this.password() === this.confirmPassword()
  );

  isFormValid = computed(() => 
    this.username().trim().length >= 3 && 
    this.email().includes('@') && 
    this.password().length >= 8 && 
    this.passwordsMatch()
  );

  onSubmit() {
    if (!this.isFormValid()) return;

    this.isLoading.set(true);
    
    const payload = {
      username: this.username(),
      email: this.email(),
      password: this.password()
    };

    this.authService.register(payload).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err) => {
        this.error.set(err.error.message || 'Registration failed');
        this.isLoading.set(false);
      }
    });
  }
}