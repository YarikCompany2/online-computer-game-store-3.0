import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../core/services/admin';
import { GameService } from '../../core/services/game';
import { ToastService } from '../../core/services/toast';
import { IGame } from '../../core/interfaces/game.interface';
import { HttpErrorResponse } from '@angular/common/http';

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

  isRejectModalOpen = signal(false);
  isRejecting = signal(false);
  selectedGame = signal<{id: string, title: string} | null>(null);

  isApproveModalOpen = signal(false);
  isApproving = signal(false);

  ngOnInit() {
    this.loadPending();
  }

  loadPending() {
    this.isLoading.set(true);
    
    this.adminService.getPendingGames().subscribe({
      next: (games: IGame[]) => {
        console.log('Successfully reached Admin API. Data:', games);
        this.pendingGames.set(games);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('If you see this, check your Backend AdminController', err);
        this.isLoading.set(false);
      }
    });
  }

  loadPendingGames() {
    this.gameService.getGames(1, 100, undefined, undefined, undefined, undefined, 'newest', false).subscribe(res => {
      this.pendingGames.set(res.data.filter(g => g.status === 'inactive'));
      this.isLoading.set(false);
    });
  }

  approve(gameId: string, title: string) {
    this.selectedGame.set({ id: gameId, title: title });
    this.isApproveModalOpen.set(true);
  }

  reject(gameId: string, title: string) {
    this.selectedGame.set({ id: gameId, title: title });
    this.isRejectModalOpen.set(true);
  }

  confirmApprove() {
    const game = this.selectedGame();
    if (!game) return;

    this.isApproving.set(true);
    this.adminService.verifyGame(game.id).subscribe({
      next: () => {
        this.toast.show(`${game.title} is now LIVE on the store!`, 'success');
        this.isApproveModalOpen.set(false);
        this.isApproving.set(false);
        this.loadPending();
      },
      error: (err) => {
        this.toast.show('Approval failed', 'error');
        this.isApproving.set(false);
      }
    });
  }

  confirmReject() {
    const game = this.selectedGame();
    if (!game) return;

    this.isRejecting.set(true);
    
    this.adminService.rejectAndWipe(game.id).subscribe({
      next: () => {
        this.toast.show(`Game "${game.title}" rejected and wiped.`, 'success');
        this.isRejectModalOpen.set(false);
        this.isRejecting.set(false);
        this.loadPending();
      },
      error: (err: HttpErrorResponse) => {
        const errorMessage = err.error?.message || 'Rejection failed';
        this.toast.show(Array.isArray(errorMessage) ? errorMessage[0] : errorMessage, 'error');
        this.isRejecting.set(false);
      }
    });
  }
}