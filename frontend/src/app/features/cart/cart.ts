import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart';
import { Router, RouterLink } from '@angular/router';
import { ToastService } from '../../core/services/toast';
import { Component, computed, inject, OnInit, signal } from '@angular/core';

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

  items = signal<any[]>([]);
  isCheckingOut = signal(false);

  totalPrice = computed(() => 
    this.items().reduce((sum, item) => sum + Number(item.game.price), 0).toFixed(2)
  );

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
        this.router.navigate(['/library']);
      },
      error: (err) => {
        this.toast.show(err.error?.message || 'Insufficient balance', 'error');
        this.isCheckingOut.set(false);
      }
    });
  }
}