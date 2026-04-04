import { Component, effect, inject, OnInit, signal } from '@angular/core';
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
import { ReviewModalService } from './core/services/review-modal';
import { ReviewService } from './core/services/review';
import { TopUpModalComponent } from './core/components/top-up-modal/top-up-modal';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, SidebarComponent, RouterLink, FormsModule, TopUpModalComponent],
  templateUrl: './app.html'
})
export class App implements OnInit {
  router = inject(Router);
  auth = inject(AuthService);
  cart = inject(CartService);
  toast = inject(ToastService);
  searchState = inject(SearchStateService);
  reviewModal = inject(ReviewModalService);

  private reviewService = inject(ReviewService);

  reviewRating = signal(5);
  reviewComment = signal('');
  isSubmittingReview = signal(false);

  constructor() {
    effect(() => {
      if (this.reviewModal.isOpen()) {
        this.reviewRating.set(this.reviewModal.initialRating());
        this.reviewComment.set(this.reviewModal.initialComment());
      }
    }, {allowSignalWrites: true})
  }

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

  submitReviewFromGlobal() {
    const gameId = this.reviewModal.gameId();
    if (!gameId) return;

    const request = this.reviewModal.isEditing() 
      ? this.reviewService.updateReview(this.reviewModal.reviewId()!, this.reviewRating(), this.reviewComment())
      : this.reviewService.createReview(gameId, this.reviewRating(), this.reviewComment());
    
    request.subscribe(() => {
      this.toast.show('Done!', 'success');
      this.reviewModal.close();
      location.reload();
    });
  }

  confirmDeleteReviewFromGlobal() {
    const id = this.reviewModal.reviewId();
    if (id) {
      this.reviewService.deleteReview(id).subscribe({
        next: () => {
          this.toast.show('Review removed', 'success');
          this.reviewModal.close();
          window.location.reload();
        }
      });
    }
  }

  isTopUpModalOpen = signal(false);

  openTopUp() {
    this.isMenuOpen.set(false);
    this.isTopUpModalOpen.set(true);
  }
}