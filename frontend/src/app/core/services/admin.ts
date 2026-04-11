import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`);
  }

  promoteToMod(userId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/promote/${userId}`, {});
  }
  
  verifyGame(gameId: string): Observable<any> {
    return this.http.patch(`http://localhost:3000/games/${gameId}/verify`, {});
  }
}