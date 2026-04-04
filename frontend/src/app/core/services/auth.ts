import { HttpClient } from '@angular/common/http';
import { Observable, switchMap, tap, throwError } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { computed, inject, Injectable, signal } from '@angular/core';
import { IAuthResponse } from '../interfaces/auth.interface';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);

  private _accessToken = signal<string | null>(localStorage.getItem('access_token'));
  
  isLoggedIn = computed(() => !!this._accessToken());

  currentUser = computed(() => {
    const token = this._accessToken();
    if (!token) return null;
    try {
      return jwtDecode<any>(token); 
    } catch {
      return null;
    }
  });

  login(credentials: any) {
    return this.http.post<any>(`http://localhost:3000/auth/login`, credentials).pipe(
      tap(res => {
        localStorage.setItem('access_token', res.accessToken);
        localStorage.setItem('refresh_token', res.refreshToken);
        this._accessToken.set(res.accessToken);
      })
    );
  }

  refreshToken() {
    const userId = this.currentUser()?.sub;
    const refreshToken = localStorage.getItem('refresh_token');

    if (!userId || !refreshToken) return throwError(() => new Error('No tokens'));

    return this.http.post<any>(`http://localhost:3000/auth/refresh`, { 
      userId, 
      refreshToken 
    }).pipe(
      tap(res => {
        localStorage.setItem('access_token', res.accessToken);
        localStorage.setItem('refresh_token', res.refreshToken);
        this._accessToken.set(res.accessToken);
      })
    );
  }

  register(userData: any) {
    return this.http.post(`http://localhost:3000/users/register`, userData);
  }

  logout() {
    localStorage.removeItem('access_token');
    this._accessToken.set(null);
  }

  topUp(amount: number): Observable<IAuthResponse> {
    return this.http.post<IAuthResponse>(`http://localhost:3000/users/top-up`, { amount }).pipe(
      switchMap(() => this.refreshToken())
    );
  }

  deleteAccount() {
    return this.http.delete(`http://localhost:3000/users/me`, {
      headers: { Authorization: `Bearer ${this.getAccessToken()}` }
    });
  }

  getAccessToken() { return this._accessToken(); }
}