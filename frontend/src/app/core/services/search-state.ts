import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SearchStateService {
  searchQuery = signal('');
  selectedCategoryId = signal<number | null>(null);

  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);

  setSearch(query: string) {
    this.searchQuery.set(query);
  }

  setCategory(id: number | null) {
    this.selectedCategoryId.set(id);
  }

  setPriceRange(min: number | null, max: number | null) {
    this.minPrice.set(min);
    this.maxPrice.set(max);
  }

  clearAll() {
    this.searchQuery.set('');
    this.selectedCategoryId.set(null);
    this.minPrice.set(null);
    this.maxPrice.set(null);
  }
}