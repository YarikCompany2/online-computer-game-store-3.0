import { Component, OnInit, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { GameService } from '../../core/services/game';
import { ICategory, IGame } from '../../core/interfaces/game.interface';
import { RouterLink } from '@angular/router';
import { SearchStateService } from '../../core/services/search-state';
import { CategoryService } from '../../core/services/category';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss'
})
export class CatalogComponent implements OnInit {
  private gameService = inject(GameService);
  private categoryService = inject(CategoryService);
  public searchState = inject(SearchStateService);

  games = signal<IGame[]>([]);
  categories = signal<ICategory[]>([]);
  isLoading = signal<boolean>(true);
  carouselIndex = signal<number>(0);

  currentPage = signal(1);
  totalPages = signal(1);
  itemsPerPage = 10;

  constructor() {
    effect(() => {
      this.loadGames(
        this.currentPage(),
        this.searchState.searchQuery(),
        this.searchState.selectedCategoryId(),
        this.searchState.minPrice() ?? undefined,
        this.searchState.maxPrice() ?? undefined,
        this.searchState.sortBy(),
        this.searchState.freeOnly()
      );
    }, { allowSignalWrites: true });

    effect(() => {
      this.searchState.searchQuery();
      this.searchState.selectedCategoryId();
      this.searchState.minPrice();
      this.searchState.maxPrice();
      
      this.currentPage.set(1);
    }, { allowSignalWrites: true });
  }

  featuredGames = computed(() => this.games().slice(0, 5));

  ngOnInit() {
    this.categoryService.getCategories().subscribe({
      next: (data) => this.categories.set(data),
      error: (err) => console.error('Failed to load categories', err)
    });
  }

  loadGames(
    page: number, 
    search?: string, 
    categoryId?: number | null, 
    minPrice?: number | null, 
    maxPrice?: number | null,
    sortBy: string = 'newest',
    freeOnly: boolean = false
  ) {
    this.isLoading.set(true);
    
    this.gameService.getGames(
      page, 
      this.itemsPerPage, 
      search ?? undefined, 
      categoryId ?? undefined, 
      minPrice ?? undefined, 
      maxPrice ?? undefined,
      sortBy,
      freeOnly
    ).subscribe({
      next: (response) => {
        this.games.set(response.data);
        this.totalPages.set(response.meta.totalPages);
        this.isLoading.set(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (err) => {
        console.error('Failed to load games:', err);
        this.isLoading.set(false);
      }
    });
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  isFilterActive = computed(() => {
    const hasSearch = this.searchState.searchQuery().length > 0;
    const hasCategory = this.searchState.selectedCategoryId() !== null;
    return hasSearch || hasCategory;
  });

  selectCategory(id: number | null) {
    this.searchState.setCategory(id);
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