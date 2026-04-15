import { Component, EventEmitter, Input, Output, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IGame } from '../../interfaces/game.interface';
import { IUpdateGameDto } from '../../interfaces/game-update.interface';
import { DashboardService, IGameStats } from '../../services/dashboard';
import { ToastService } from '../../services/toast';
import { CategoryService } from '../../services/category';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-edit-game-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './edit-game-modal.html'
})
export class EditGameModalComponent implements OnInit {
  private http = inject(HttpClient);
  private catService = inject(CategoryService);
  private dashboardService = inject(DashboardService);
  private toast = inject(ToastService);

  @Input({ required: true }) game!: IGameStats;
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  isLoading = signal(false);

  editData = {
    title: '',
    description: '',
    price: 0
  };

  ngOnInit() {
    this.editData = {
      title: this.game.title,
      description: this.game.description,
      price: this.game.price
    };
  }

  save() {
    const numericPrice = Number(this.editData.price);

    if (!this.editData.title.trim() || isNaN(numericPrice) || numericPrice < 0) {
      this.toast.show('Please provide a valid title and price', 'error');
      return;
    }

    this.isLoading.set(true);

    const dto: IUpdateGameDto = {
      title: this.editData.title.trim(),
      description: this.editData.description.trim(),
      price: numericPrice
    };

    this.dashboardService.updateGame(this.game.id, dto).subscribe({
      next: () => {
        this.toast.show('Game updated successfully', 'success');
        this.isLoading.set(false);
        this.updated.emit();
        this.close.emit();
      },
      error: (err) => {
        const msg = err.error?.message;
        this.toast.show(Array.isArray(msg) ? msg[0] : msg || 'Error', 'error');
      }
    });
  }

  toggleStatus() {
    const currentStatus = this.game.status || 'active';
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    
    this.isLoading.set(true);

    if (currentStatus === 'pending_moderation') {
      this.toast.show('Moderation required before changing visibility', 'error');
      return;
    }

    this.dashboardService.updateGame(this.game.id, { status: newStatus } as any).subscribe({
      next: () => {
        this.toast.show(`Game visibility set to: ${newStatus}`, 'success');
        this.isLoading.set(false);
        this.updated.emit();
        this.close.emit();
      },
      error: (err) => {
        this.toast.show('Status update failed', 'error');
        this.isLoading.set(false);
      }
    });
  }

  deleteGame() {
    if (confirm(`Are you absolutely sure you want to delete "${this.game.title}"? This cannot be undone.`)) {
      this.isLoading.set(true);
      this.dashboardService.deleteGame(this.game.id).subscribe({
        next: () => {
          this.toast.show('Game removed from store', 'success');
          this.isLoading.set(false);
          this.updated.emit();
          this.close.emit();
        },
        error: (err) => {
          this.toast.show(err.error?.message || 'Delete failed', 'error');
          this.isLoading.set(false);
        }
      });
    }
  }
}