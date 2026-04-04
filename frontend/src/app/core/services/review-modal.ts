import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ReviewModalService {
  isOpen = signal(false);
  isDeleteOpen = signal(false);
  gameId = signal<string | null>(null);
  gameTitle = signal('');
  
  isEditing = signal(false);
  reviewId = signal<string | null>(null);
  initialRating = signal(5);
  initialComment = signal('');

  open(gameId: string, title: string, editData?: { id: string, rating: number, comment: string }) {
    this.gameId.set(gameId);
    this.gameTitle.set(title);
    
    if (editData) {
      this.isEditing.set(true);
      this.reviewId.set(editData.id);
      this.initialRating.set(editData.rating);
      this.initialComment.set(editData.comment);
    } else {
      this.isEditing.set(false);
      this.initialRating.set(5);
      this.initialComment.set('');
    }
    
    this.isOpen.set(true);
  }

  openDelete(reviewId: string) {
    this.reviewId.set(reviewId);
    this.isDeleteOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
  }
}