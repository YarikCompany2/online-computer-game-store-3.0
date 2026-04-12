import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface INotification {
  id: string;
  message: string;
  status: 'pending' | 'accepted' | 'rejected';
  gameId: string | null;
  type: 'game_publish' | 'moderation_request' | 'company_invitation';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/notifications';

  getNotifications(): Observable<INotification[]> {
    return this.http.get<INotification[]>(this.apiUrl);
  }

  respond(id: string, accept: boolean): Observable<any> {
    return this.http.patch(`${this.apiUrl}/${id}/respond`, { accept });
  }
}