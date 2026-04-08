import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LibraryService } from '../../core/services/library';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth';
import { ILibraryItem } from '../../core/interfaces/game.interface';
import { GameService } from '../../core/services/game';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './library.html'
})
export class LibraryComponent implements OnInit {
  private libraryService = inject(LibraryService);
  private gameService = inject(GameService);
  public auth = inject(AuthService);
  
  ownedGames = signal<ILibraryItem[]>([]);
  isLoading = signal(true);
  
  showDownloadModal = signal(false);
  selectedGameName = signal('');

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

  openDownloadDialog(gameTitle: string) {
    this.selectedGameName.set(gameTitle);
    this.showDownloadModal.set(true);
  }

  closeDownloadDialog() {
    this.showDownloadModal.set(false);
  }
}