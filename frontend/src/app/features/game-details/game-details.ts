import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { GameService } from '../../core/services/game';
import { IGame, IMedia } from '../../core/interfaces/game.interface';
import { CartService } from '../../core/services/cart';
import { AuthService } from '../../core/services/auth';
import { ToastService } from '../../core/services/toast';
import { IReview, ReviewService } from '../../core/services/review';
import { FormsModule } from '@angular/forms';
import { ReviewModalService } from '../../core/services/review-modal';

@Component({
  selector: 'app-game-details',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './game-details.html',
  styleUrl: './game-details.scss'
})
export class GameDetailsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private gameService = inject(GameService);
  private cartService = inject(CartService);
  public auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService)
  private reviewService = inject(ReviewService);
  public reviewModal = inject(ReviewModalService);
  
  game = signal<IGame | null>(null);
  isLoading = signal(true);
  selectedMedia = signal<IMedia | null>(null);
  isAddingToCart = signal(false);
  reviewRating = signal(5);
  reviewComment = signal('');

  reviews = signal<IReview[]>([]);

  private autoSlideInterval: any;
  private isAutoSlidingActive = signal(true);

  screenshotsOnly = computed(() => 
    this.game()?.media.filter(m => !m.isMain) || []
  );

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.gameService.getGameById(id).subscribe({
        next: (data) => {
          this.game.set(data);
          
          const firstScreenshot = data.media.find(m => !m.isMain);
          this.selectedMedia.set(firstScreenshot || data.media[0]);
          
          this.isLoading.set(false);
          this.startAutoSlide();
          this.loadReviews(id);
        }
      });
    }
  }

  addToCart() {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const game = this.game();
    if (!game) return;

    this.isAddingToCart.set(true);
    this.cartService.addToCart(game.id).subscribe({
      next: () => {
        this.toast.show(`${game.title} added to cart!`, 'success');
        this.isAddingToCart.set(false);
      },
      error: (err) => {
        this.toast.show(err.error?.message || 'Error adding to cart', 'error');
        this.isAddingToCart.set(false);
      }
    });
  }
  
  ngOnDestroy() {
    this.stopAutoSlide();
  }

  private startAutoSlide() {
    this.autoSlideInterval = setInterval(() => {
      if (this.isAutoSlidingActive()) {
        this.nextMedia();
      }
    }, 4000);
  }

  private stopAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  private nextMedia() {
    const screens = this.screenshotsOnly();
    if (screens.length <= 1) return;

    const currentIndex = screens.indexOf(this.selectedMedia()!);
    const nextIndex = (currentIndex + 1) % screens.length;
    this.selectedMedia.set(screens[nextIndex]);
  }

  selectMedia(media: IMedia) {
    this.selectedMedia.set(media);
    this.isAutoSlidingActive.set(false);
    this.stopAutoSlide();
  }

  minRequirements = computed(() => 
    this.game()?.requirements.find(r => r.type === 'minimum')
  );

  recRequirements = computed(() => 
    this.game()?.requirements.find(r => r.type === 'recommended')
  );

  loadReviews(gameId: string) {
    this.reviewService.getByGame(gameId).subscribe(data => this.reviews.set(data));
  }

  myReview = computed(() => 
    this.reviews().find(r => r.user.username === this.auth.currentUser()?.username)
  );

  isEditing = signal(false);

  deleteMyReview(id: string) {
    if (confirm('Delete this review?')) {
      this.reviewService.deleteReview(id).subscribe(() => {
        this.toast.show('Deleted', 'success');
        this.loadReviews(this.game()!.id);
      });
    }
  }

  startEdit() {
    const rev = this.myReview();
    const g = this.game();
    if (rev && g) {
      this.reviewModal.open(g.id, g.title, {
        id: rev.id,
        rating: rev.rating,
        comment: rev.comment,
      });
    }
  }

  submitReview() {
    const gameId = this.game()?.id;
    if (!gameId) return;

    this.reviewService.createReview(gameId, this.reviewRating(), this.reviewComment()).subscribe({
      next: () => {
        this.toast.show('Review posted! Thank you.', 'success');
        this.reviewComment.set('');
        this.loadReviews(gameId);
      },
      error: (err) => this.toast.show(err.error?.message || 'Error posting review', 'error')
    });
  }

  openWriteModal() {
    const g = this.game();
    if (g) this.reviewModal.open(g.id, g.title);
  }

  openDelete(reviewId: string) {
    this.reviewModal.openDelete(reviewId);
  }

  closeReviewModal() {
    this.reviewModal.close();
  }
}