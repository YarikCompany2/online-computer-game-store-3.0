import { Component, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { SidebarComponent } from './core/components/sidebar/sidebar';
import { CommonModule } from '@angular/common';
import { filter, map } from 'rxjs';
import { AuthService } from './core/services/auth';
import { CartService } from './core/services/cart';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ToastService } from './core/services/toast';
import { SearchStateService } from './core/services/search-state';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, RouterLink, FormsModule],
  templateUrl: './app.html'
})
export class App implements OnInit {
  router = inject(Router);
  auth = inject(AuthService);
  cart = inject(CartService);
  toast = inject(ToastService);
  searchState = inject(SearchStateService);

  isAuthPage = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.router.url.includes('/login') || this.router.url.includes('/register'))
    ),
    { initialValue: false }
  );

  isMenuOpen = signal(false);

  toggleMenu() {
    this.isMenuOpen.update(v => !v);
  }

  closeMenu() {
    this.isMenuOpen.set(false);
  }

  onSearchSubmit(value: string) {
    this.searchState.setSearch(value.trim());
  }

  isDeleteModalOpen = signal(false);
  confirmUsernameInput = signal('');
  isDeleting = signal(false);
  isFilterMenuOpen = signal(false);
  minPriceInput: number | null = null;
  maxPriceInput: number | null = null;

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.cart.getCart().subscribe();
    }
  }

  openDeleteModal() {
    this.isMenuOpen.set(false);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal() {
    this.isDeleteModalOpen.set(false);
    this.confirmUsernameInput.set(0 as any);
  }

  confirmDelete() {
    const currentUsername = this.auth.currentUser()?.username;
    
    if (this.confirmUsernameInput().toLowerCase() === currentUsername?.toLowerCase()) {
      this.isDeleting.set(true);
      this.auth.deleteAccount().subscribe({
        next: () => {
          this.auth.logout();
          this.closeDeleteModal();
          this.isDeleting.set(false);
          this.router.navigate(['/login']);
        },
        error: (err) => {
          alert(err.error?.message || 'Error deleting account');
          this.isDeleting.set(false);
        }
      });
    }
  }

  applyFilters() {
    this.searchState.setPriceRange(this.minPriceInput, this.maxPriceInput);
    this.isFilterMenuOpen.set(false);
  }

  resetFilters() {
    this.minPriceInput = null;
    this.maxPriceInput = null;
    this.searchState.clearAll();
    this.isFilterMenuOpen.set(false);
  }
}