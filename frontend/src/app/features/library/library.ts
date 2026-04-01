import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LibraryService } from '../../core/services/library';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './library.html'
})
export class LibraryComponent implements OnInit {
  private libraryService = inject(LibraryService);
  public auth = inject(AuthService);
  
  ownedGames = signal<any[]>([]);
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

  openDownloadDialog(gameTitle: string) {
    this.selectedGameName.set(gameTitle);
    this.showDownloadModal.set(true);
  }

  closeDownloadDialog() {
    this.showDownloadModal.set(false);
  }
}