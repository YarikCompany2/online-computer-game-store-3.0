import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../core/services/game';
import { IGame } from '../../core/interfaces/game.interface';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss'
})
export class CatalogComponent implements OnInit {
  private gameService = inject(GameService);
  
  games = signal<IGame[]>([]);
  isLoading = signal<boolean>(true);
  
  carouselIndex = signal<number>(0);

  featuredGames = computed(() => this.games().slice(0, 5));

  ngOnInit() {
    this.gameService.getGames(1, 20).subscribe({
      next: (response) => {
        this.games.set(response.data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to load games:', err);
        this.isLoading.set(false);
      }
    });
  }

  nextSlide() {
    if (this.featuredGames().length === 0) return;
    this.carouselIndex.update(val => (val + 1) % this.featuredGames().length);
  }

  prevSlide() {
    if (this.featuredGames().length === 0) return;
    this.carouselIndex.update(val => (val - 1 + this.featuredGames().length) % this.featuredGames().length);
  }
}