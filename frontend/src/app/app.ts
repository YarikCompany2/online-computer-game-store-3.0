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
import { INotification, NotificationService } from './core/services/notification';
import { HttpClient } from '@angular/common/http';

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
  http = inject(HttpClient);

  private reviewService = inject(ReviewService);
  private notifService = inject(NotificationService);
  private pollingInterval: any;

  reviewRating = signal(5);
  reviewComment = signal('');
  isSubmittingReview = signal(false);
  isNotifMenuOpen = signal(false);
  notifications = signal<INotification[]>([]);
  isLeaveModalOpen = signal(false);
  isLeaving = signal(false);

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

  onAvatarSelected(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    this.http.patch<any>('http://localhost:3000/users/avatar', formData, {
      headers: { Authorization: `Bearer ${this.auth.getAccessToken()}` }
    }).subscribe({
      next: (res) => {
        this.toast.show('Avatar updated! Refreshing...', 'success');
        this.auth.refreshToken().subscribe(() => window.location.reload());
      },
      error: () => this.toast.show('Avatar upload failed', 'error')
    });
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
      this.loadNotifications();
      
      this.startNotificationPolling();
    }
    console.log('CURRENT USER DATA:', this.auth.currentUser());
  }

  startNotificationPolling() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);

    this.pollingInterval = setInterval(() => {
      if (this.auth.isLoggedIn()) {
        this.notifService.getNotifications().subscribe(data => {
          if (JSON.stringify(data) !== JSON.stringify(this.notifications())) {
            this.notifications.set(data);
            console.log('New notifications received');
          }
        });
      }
    }, 5000); 
  }

  ngOnDestroy() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
  }

  loadNotifications() {
    this.notifService.getNotifications().subscribe({
      next: (data) => this.notifications.set(data),
      error: () => console.error('Could not load notifications')
    });
  }

  openLeaveModal() {
    this.isMenuOpen.set(false);
    this.isLeaveModalOpen.set(true);
  }

  confirmLeave() {
    this.isLeaving.set(true);
    this.auth.leaveCompany().subscribe({
      next: () => {
        this.toast.show('You have left the studio.', 'success');
        this.isLeaveModalOpen.set(false);
        this.isLeaving.set(false);
        this.loadNotifications();
      },
      error: (err) => {
        this.toast.show(err.error?.message || 'Action failed', 'error');
        this.isLeaving.set(false);
      }
    });
  }

  respondToNotif(id: string, accept: boolean) {
    this.notifService.respond(id, accept).subscribe({
      next: (res: any) => {
        this.toast.show(accept ? 'Partnership confirmed!' : 'Collaboration rejected and deleted', accept ? 'success' : 'error');
        this.loadNotifications();
        
        if (accept) {
           setTimeout(() => window.location.reload(), 1000);
        }
      }
    });
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

  leaveCompany() {
    if (confirm('Are you sure you want to leave your current studio?')) {
      this.auth.leaveCompany().subscribe({
        next: () => {
          this.toast.show('You have left the studio.', 'success');
          this.closeMenu();
        },
        error: (err) => {
          this.toast.show(err.error?.message || 'Action failed', 'error');
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

  restrictNumeric(event: KeyboardEvent) {
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 
      'ArrowLeft', 'ArrowRight', 'Home', 'End', '.'
    ];

    if (
      allowedKeys.includes(event.key) ||
      (event.ctrlKey === true || event.metaKey === true)
    ) {
      if (event.key === '.') {
        const input = event.target as HTMLInputElement;
        if (input.value.includes('.')) {
          event.preventDefault();
        }
      }
      return;
    }

    if (!/^[0-9]$/.test(event.key)) {
      event.preventDefault();
    }
  }

  isTopUpModalOpen = signal(false);

  openTopUp() {
    this.isMenuOpen.set(false);
    this.isTopUpModalOpen.set(true);
  }
}