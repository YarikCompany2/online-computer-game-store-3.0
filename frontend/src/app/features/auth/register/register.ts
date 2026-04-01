import { Component, inject, signal } from '@angular/core';
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

  formData = {
    email: '',
    username: '',
    password: ''
  };
  
  error = signal<string | null>(null);
  isLoading = signal(false);

  onSubmit() {
    this.isLoading.set(true);
    this.authService.register(this.formData).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (err) => {
        this.error.set(err.error.message || 'Registration failed');
        this.isLoading.set(false);
      }
    });
  }
}