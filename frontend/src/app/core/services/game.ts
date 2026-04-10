import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IGame, IPaginatedResponse } from '../interfaces/game.interface';
import { AuthService } from './auth';
import { ILaunchResponse } from '../interfaces/launcher.interface';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = 'http://localhost:3000/games';

  getGames(
    page: number = 1, 
    limit: number = 10, 
    search?: string, 
    categoryId?: number, 
    minPrice?: number, 
    maxPrice?: number,
    sortBy: string = 'newest',
    freeOnly: boolean = false
  ): Observable<IPaginatedResponse<IGame>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sortBy', sortBy)
      .set('freeOnly', freeOnly.toString());

    if (search) params = params.set('search', search);
    if (categoryId) params = params.set('categoryId', categoryId.toString());
    if (minPrice !== undefined) params = params.set('minPrice', minPrice.toString());
    if (maxPrice !== undefined) params = params.set('maxPrice', maxPrice.toString());

    return this.http.get<IPaginatedResponse<IGame>>(this.apiUrl, { params });
  }

  onFileSelected(event: any, gameId: string) {
    const file: File = event.target.files[0];
    
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('gameId', gameId);

      this.http.post('http://localhost:3000/media/upload', formData).subscribe(res => {
        console.log('Cover uploaded!', res);
      });
    }
  }

  downloadGame(gameId: string) {
    window.open(`http://localhost:3000/games/download/${gameId}`, '_blank');
  }

  launchViaLauncher(gameId: string) {
    const token = this.auth.getAccessToken();
    
    const deepLink = `sadstore://open/${gameId}/${token}`;
    
    window.location.href = deepLink;
  }

  getGameById(id: string): Observable<IGame> {
    let headers = new HttpHeaders();
    const token = this.auth.getAccessToken();

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return this.http.get<IGame>(`${this.apiUrl}/${id}`, { headers });
  }

  getLaunchInfo(gameId: string): Observable<ILaunchResponse> {
    return this.http.get<ILaunchResponse>(`${this.apiUrl}/launch-info/${gameId}`);
  }
}