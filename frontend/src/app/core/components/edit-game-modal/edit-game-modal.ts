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

  categories = signal<any[]>([]);
  platforms = signal<any[]>([]);

  @Input({ required: true }) game!: IGameStats;
  @Output() close = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  isLoading = signal(false);
  isDeleteModalOpen = signal(false);

  editData = {
    title: '',
    description: '',
    price: 0
  };

  categoryIds = signal<number[]>([]);
  selectedPlatformIds = signal<number[]>([]);
  minSpecs = signal({ processor: '', ram: '', gpu: '', storage: '' });
  recSpecs = signal({ processor: '', ram: '', gpu: '', storage: '' });

  ngOnInit() {
    this.catService.getCategories().subscribe(res => this.categories.set(res));
    this.http.get<any[]>('http://localhost:3000/platform').subscribe(res => this.platforms.set(res));

    this.http.get<any>(`http://localhost:3000/games/${this.game.id}`).subscribe(fullGame => {
      this.editData.title = fullGame.title;
      this.editData.description = fullGame.description;
      this.editData.price = fullGame.price;

      this.categoryIds.set(fullGame.categories?.map((c: any) => c.id) || []);

      const min = fullGame.requirements?.find((r: any) => r.type === 'minimum');
      const rec = fullGame.requirements?.find((r: any) => r.type === 'recommended');

      if (min) {
        this.minSpecs.set({
          processor: min.processor || '',
          ram: min.ram || '',
          gpu: min.gpu || '',
          storage: min.storage || ''
        });
        this.selectedPlatformIds.set(min.platforms?.map((p: any) => p.id) || []);
      }

      if (rec) {
        this.recSpecs.set({
          processor: rec.processor || '',
          ram: rec.ram || '',
          gpu: rec.gpu || '',
          storage: rec.storage || ''
        });
      }
    });
  }

  save() {
    this.isLoading.set(true);
    
    const requirements = [
      { type: 'minimum', ...this.minSpecs(), platformIds: this.selectedPlatformIds() },
      { type: 'recommended', ...this.recSpecs(), platformIds: this.selectedPlatformIds() }
    ];

    const payload = {
      title: this.editData.title,
      description: this.editData.description,
      price: Number(this.editData.price),
      categoryIds: this.categoryIds(),
      requirements: requirements
    };

    this.dashboardService.updateGame(this.game.id, payload as any).subscribe({
      next: () => {
        this.toast.show('Project data synchronized', 'success');
        this.updated.emit();
        this.close.emit();
      },
      error: (err) => {
        const msg = err.error?.message;
        this.toast.show(Array.isArray(msg) ? msg[0] : msg || 'Sync failed', 'error');
        this.isLoading.set(false);
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

  toggleCategory(id: number) {
    const current = this.categoryIds();
    if (current.includes(id)) {
      this.categoryIds.set(current.filter(x => x !== id));
    } else {
      this.categoryIds.set([...current, id]);
    }
  }

  togglePlatform(id: number) {
    const current = this.selectedPlatformIds();
    if (current.includes(id)) {
      this.selectedPlatformIds.set(current.filter(x => x !== id));
    } else {
      this.selectedPlatformIds.set([...current, id]);
    }
  }

  openDeleteModal() {
    this.isDeleteModalOpen.set(true);
  }

  confirmDelete() {
    this.isLoading.set(true);
    this.dashboardService.deleteGame(this.game.id).subscribe({
      next: () => {
        this.toast.show('Game removed from store', 'success');
        this.isLoading.set(false);
        this.isDeleteModalOpen.set(false);
        this.updated.emit();
        this.close.emit();
      },
      error: (err) => {
        this.toast.show(err.error?.message || 'Delete failed', 'error');
        this.isLoading.set(false);
        this.isDeleteModalOpen.set(false);
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