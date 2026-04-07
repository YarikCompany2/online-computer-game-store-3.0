import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IGameStats {
  id: string;
  title: string;
  price: number;
  salesCount: number;
  totalRevenue: number;
  mainCover: string | null;
}

export interface IDashboardStats {
  totalRevenue: number;
  totalSales: number;
  activeGamesCount: number;
  games: IGameStats[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/company-dashboard';

  getStats(): Observable<IDashboardStats> {
    return this.http.get<IDashboardStats>(`${this.apiUrl}/stats`);
  }
}