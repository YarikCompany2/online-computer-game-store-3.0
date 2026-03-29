import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../core/services/game';
import { IGame } from '../../core/interfaces/game.interface';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss'
})
export class CatalogComponent implements OnInit {
  private gameService = inject(GameService);
  games: IGame[] = [];
  isLoading = true;

  ngOnInit() {
    this.gameService.getGames(1, 20).subscribe({
      next: (response) => {
        this.games = response.data;
        this.isLoading = false;
        console.log('Games loaded successfully');
      },
      error: (err) => {
        console.error('Failed to load games:', err);
        this.isLoading = false;
      }
    });
  }
}