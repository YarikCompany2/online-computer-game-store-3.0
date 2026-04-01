import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
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
export class GameDetailsComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private gameService = inject(GameService);
  
  game = signal<IGame | null>(null);
  isLoading = signal(true);
  selectedMedia = signal<IMedia | null>(null);

  private autoSlideInterval: any;
  private isAutoSlidingActive = signal(true);

  screenshotsOnly = computed(() => 
    this.game()?.media.filter(m => !m.isMain) || []
  );

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.gameService.getGameById(id).subscribe({
        next: (data) => {
          this.game.set(data);
          
          const firstScreenshot = data.media.find(m => !m.isMain);
          this.selectedMedia.set(firstScreenshot || data.media[0]);
          
          this.isLoading.set(false);
          this.startAutoSlide();
        }
      });
    }
  }
  
  ngOnDestroy() {
    this.stopAutoSlide();
  }

  private startAutoSlide() {
    this.autoSlideInterval = setInterval(() => {
      if (this.isAutoSlidingActive()) {
        this.nextMedia();
      }
    }, 4000);
  }

  private stopAutoSlide() {
    if (this.autoSlideInterval) {
      clearInterval(this.autoSlideInterval);
    }
  }

  private nextMedia() {
    const screens = this.screenshotsOnly();
    if (screens.length <= 1) return;

    const currentIndex = screens.indexOf(this.selectedMedia()!);
    const nextIndex = (currentIndex + 1) % screens.length;
    this.selectedMedia.set(screens[nextIndex]);
  }

  selectMedia(media: IMedia) {
    this.selectedMedia.set(media);
    this.isAutoSlidingActive.set(false);
    this.stopAutoSlide();
  }
}