import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth';

@Injectable({ providedIn: 'root' })
export class LibraryService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private apiUrl = 'http://localhost:3000/library';

  getMyLibrary(): Observable<any[]> {
    const headers = new HttpHeaders().set('Authorization', `Bearer ${this.auth.getAccessToken()}`);
    return this.http.get<any[]>(this.apiUrl, { headers });
  }
}