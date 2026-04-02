import { Injectable, signal } from '@angular/core';

export interface ToastData {
  message: string;
  type: 'success' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  data = signal<ToastData | null>(null);

  show(message: string, type: 'success' | 'error' = 'success') {
    this.data.set({ message, type });

    setTimeout(() => {
      this.data.set(null);
    }, 3000);
  }
}