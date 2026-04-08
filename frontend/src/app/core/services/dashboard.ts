import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IUpdateGameDto } from '../interfaces/game-update.interface';
import { IGame, IMedia } from '../interfaces/game.interface';

export interface IGameStats {
  id: string;
  title: string;
  description: string;
  price: number;
  salesCount: number;
  totalRevenue: number;
  mainCover: string | null;
  status: string;
}

export interface IDashboardStats {
  totalRevenue: number;
  totalSales: number;
  activeGamesCount: number;
  games: IGameStats[];
}

export interface ICreateGameDto {
  title: string;
  description: string;
  price: number;
  categoryIds: number[];
}

export interface IUploadMediaResponse extends IMedia {
  gameId: string;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/company-dashboard';

  getStats(): Observable<IDashboardStats> {
    return this.http.get<IDashboardStats>(`${this.apiUrl}/stats`);
  }

  getGameDetailStats(gameId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/game-stats/${gameId}`);
  }

  updateGame(gameId: string, dto: IUpdateGameDto): Observable<IGame> {
    return this.http.patch<IGame>(`http://localhost:3000/games/${gameId}`, dto);
  }

  uploadBuild(formData: FormData): Observable<any> {
    return this.http.post(`http://localhost:3000/games/upload-build`, formData);
  }

  createGame(dto: ICreateGameDto): Observable<IGame> {
    return this.http.post<IGame>(`http://localhost:3000/games`, dto);
  }

  uploadMedia(formData: FormData): Observable<IUploadMediaResponse> {
    return this.http.post<IUploadMediaResponse>(`http://localhost:3000/media/upload`, formData);
  }

  deleteGame(gameId: string): Observable<any> {
    return this.http.delete(`http://localhost:3000/games/${gameId}`);
  }
}