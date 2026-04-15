import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth';
import { tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class CartService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = 'http://localhost:3000/cart';
  private ordersUrl = 'http://localhost:3000/orders';

  cartItemsCount = signal(0);

  private getHeaders() {
    return new HttpHeaders().set('Authorization', `Bearer ${this.auth.getAccessToken()}`);
  }

  addToCart(gameId: string) {
    return this.http.post(this.apiUrl, { gameId }).pipe(
        tap(() => this.cartItemsCount.update(v => v + 1))
    );
  }

  getCart() {
    return this.http.get<any[]>(this.apiUrl).pipe(
        tap(items => this.cartItemsCount.set(items.length))
    );
  }

  removeFromCart(gameId: string) {
    return this.http.delete(`${this.apiUrl}/${gameId}`).pipe(
        tap(() => this.cartItemsCount.update(v => v - 1))
    );
  }

  checkout() {
    return this.http.post(`${this.ordersUrl}/checkout`, {});
  }
}