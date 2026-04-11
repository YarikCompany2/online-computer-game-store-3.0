import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService, IDashboardStats, IGameStats } from '../../core/services/dashboard';
import { AuthService } from '../../core/services/auth';
import { RouterLink } from '@angular/router';
import { EditGameModalComponent } from '../../core/components/edit-game-modal/edit-game-modal';
import { CreateGameModalComponent } from '../../core/components/create-game-modal/create-game-modal';
import { ToastService } from '../../core/services/toast';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, EditGameModalComponent, CreateGameModalComponent],
  templateUrl: './dashboard.html'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  public auth = inject(AuthService);
  private toast = inject(ToastService);

  stats = signal<IDashboardStats | null>(null);
  selectedGame = signal<IGameStats | null>(null);
  isLoading = signal(true);
  isOwner = signal(true);
  isCreateModalOpen = signal(false);

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.dashboardService.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  sendInvite(identifier: string) {
    if (!identifier.trim()) return;

    this.dashboardService.inviteMember(identifier).subscribe({
      next: () => this.toast.show(`Invitation sent to ${identifier}!`, 'success'),
      error: (err) => this.toast.show(err.error?.message || 'Failed to send invite', 'error')
    });
  }

  openEdit(game: IGameStats, event: Event) {
    event.stopPropagation();
    this.selectedGame.set(game as any); 
  }

  openCreateModal() {
    this.isCreateModalOpen.set(true);
  }
}