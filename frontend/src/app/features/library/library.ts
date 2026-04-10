import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LibraryService } from '../../core/services/library';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { ILibraryItem } from '../../core/interfaces/game.interface';
import { GameService } from '../../core/services/game';
import { ToastService } from '../../core/services/toast';
import { ILaunchResponse } from '../../core/interfaces/launcher.interface';

interface ISelectedGame {
  id: string;
  title: string;
}

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './library.html'
})
export class LibraryComponent implements OnInit {
  private libraryService = inject(LibraryService);
  private gameService = inject(GameService);
  private toast = inject(ToastService);
  public auth = inject(AuthService);
  
  ownedGames = signal<ILibraryItem[]>([]);
  isLoading = signal(true);
  
  showLauncherModal = signal<boolean>(false);
  selectedGameForLaunch = signal<ISelectedGame | null>(null);

  ngOnInit() {
    if (this.auth.isLoggedIn()) {
      this.libraryService.getMyLibrary().subscribe({
        next: (data) => {
          this.ownedGames.set(data);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false)
      });
    } else {
      this.isLoading.set(false);
    }
  }

  onDownloadClick(gameId: string) {
    this.gameService.downloadGame(gameId);
  }

  launchGame(gameId: string) {
    this.gameService.getLaunchInfo(gameId).subscribe({
      next: (res: any) => {
        console.log('Handing off to Launcher:', res.url);
        
        window.location.href = res.url;
        
        this.toast.show('Opening SAD Launcher...', 'success');
      },
      error: () => this.toast.show('Launcher hand-off failed', 'error')
    });
  }

  onPlayClick(gameId: string, gameTitle: string) {
    this.selectedGameForLaunch.set({ id: gameId, title: gameTitle });
    this.showLauncherModal.set(true);
  }

  triggerDeepLink(): void {
    const game = this.selectedGameForLaunch();
    if (game) {
      this.gameService.getLaunchInfo(game.id).subscribe({
        next: (res: ILaunchResponse) => {
          window.location.href = res.url;
          this.closeModal();
        }
      });
    }
  }

  closeModal() {
    this.showLauncherModal.set(false);
    this.selectedGameForLaunch.set(null);
    
    this.toast.clear(); 
  }
}