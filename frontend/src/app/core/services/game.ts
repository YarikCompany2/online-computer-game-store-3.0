import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IGame, IPaginatedResponse } from '../interfaces/game.interface';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/games';

  getGames(page: number = 1, limit: number = 10, search?: string): Observable<IPaginatedResponse<IGame>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (search) {
      params = params.set('search', search);
    }

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
}