import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface IReview {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: {
    username: string;
  };
}

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/reviews';

  getByGame(gameId: string): Observable<IReview[]> {
    return this.http.get<IReview[]>(`${this.apiUrl}/game/${gameId}`);
  }

  createReview(gameId: string, rating: number, comment: string) {
    return this.http.post(this.apiUrl, { gameId, rating, comment });
  }

  updateReview(id: string, rating: number, comment: string) {
    return this.http.patch(`${this.apiUrl}/${id}`, { rating, comment });
  }

  deleteReview(id: string) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}