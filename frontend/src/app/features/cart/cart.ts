import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cart.html'
})
export class CartComponent implements OnInit {
  private cartService = inject(CartService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  items = signal<any[]>([]);
  isCheckingOut = signal(false);

  totalPrice = computed(() => {
    const sum = this.items().reduce((total, item) => {
      let price = Number(item.game.price);
      const disc = item.game.discount;

      if (disc && disc.isActive) {
        price = price * (1 - disc.discountPercent / 100);
      }
      return total + price;
    }, 0);
    
    return sum.toFixed(2);
  });

  ngOnInit() {
    this.loadCart();
  }

  loadCart() {
    this.cartService.getCart().subscribe({
      next: (data) => this.items.set(data),
      error: () => this.toast.show('Failed to load cart', 'error')
    });
  }

  removeItem(gameId: string) {
    this.cartService.removeFromCart(gameId).subscribe({
      next: () => {
        this.loadCart();
        this.toast.show('Item removed', 'success');
      }
    });
  }

  buyNow() {
    this.isCheckingOut.set(true);
    this.cartService.checkout().subscribe({
      next: () => {
        this.toast.show('Purchase successful!', 'success');
        this.cartService.cartItemsCount.set(0);
        
        this.auth.refreshToken().subscribe({
          next: () => {
            this.router.navigate(['/library']);
          },
          error: () => this.router.navigate(['/library'])
        });
      },
      error: (err) => {
        this.toast.show(err.error?.message || 'Insufficient balance', 'error');
        this.isCheckingOut.set(false);
      }
    });
  }
}