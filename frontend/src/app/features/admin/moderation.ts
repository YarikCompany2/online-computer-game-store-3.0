import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin';
import { GameService } from '../../core/services/game';
import { ToastService } from '../../core/services/toast';

@Component({
  selector: 'app-moderation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './moderation.html'
})
export class ModerationComponent implements OnInit {
  private adminService = inject(AdminService);
  private gameService = inject(GameService);
  private toast = inject(ToastService);

  pendingGames = signal<any[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadPendingGames();
  }

  loadPendingGames() {
    this.gameService.getGames(1, 100, undefined, undefined, undefined, undefined, 'newest', false).subscribe(res => {
      this.pendingGames.set(res.data.filter(g => g.status === 'inactive'));
      this.isLoading.set(false);
    });
  }

  approve(gameId: string, title: string) {
    this.adminService.verifyGame(gameId).subscribe({
      next: () => {
        this.toast.show(`${title} has been approved!`, 'success');
        this.loadPendingGames();
      }
    });
  }
}