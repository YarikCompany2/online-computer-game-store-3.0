import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IGame } from '../interfaces/game.interface';

export interface IGlobalStats {
  totalPlatformRevenue: number;
  totalUsers: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/admin';

  getStats(): Observable<IGlobalStats> {
    return this.http.get<IGlobalStats>(`${this.apiUrl}/stats`);
  }

  getGlobalDiscounts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/discounts`);
  }

  createGlobalDiscount(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/discounts`, data);
  }

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  getPendingGames(): Observable<IGame[]> {
    return this.http.get<IGame[]>(`http://localhost:3000/admin/moderation/pending`);
  }

  promoteToMod(userId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/promote/${userId}`, {});
  }

  searchUsers(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users/search?q=${query}`);
  }

  demoteFromMod(userId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/demote/${userId}`, {});
  }
  
  verifyGame(gameId: string): Observable<any> {
    return this.http.patch(`http://localhost:3000/games/${gameId}/verify`, {});
  }

  rejectGame(gameId: string): Observable<void> {
    return this.http.delete<void>(`http://localhost:3000/games/${gameId}`);
  }

  rejectAndWipe(gameId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/moderation/reject/${gameId}`);
  }

  toggleDiscount(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/discounts/${id}/toggle`, {});
  }

  deleteDiscount(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/discounts/${id}`);
  }
}