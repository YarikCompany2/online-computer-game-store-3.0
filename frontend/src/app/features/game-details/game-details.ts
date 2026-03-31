import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GameService } from '../../core/services/game';
import { IGame, IMedia } from '../../core/interfaces/game.interface';

@Component({
  selector: 'app-game-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './game-details.html',
  styleUrl: './game-details.scss'
})
export class GameDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private gameService = inject(GameService);
  
  game = signal<IGame | null>(null);
  isLoading = signal(true);

  selectedMedia = signal<IMedia | null>(null);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.gameService.getGameById(id).subscribe({
        next: (data) => {
          this.game.set(data);
          const firstScreenshot = data.media.find(m => !m.isMain) || data.media[0];
          this.selectedMedia.set(firstScreenshot);
          this.isLoading.set(false);
        }
      });
    }
  }

  selectMedia(media: IMedia) {
    this.selectedMedia.set(media);
  }
}