import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService, IGlobalStats } from '../../core/services/admin';
import { ToastService } from '../../core/services/toast';

@Component({
  selector: 'app-admin-hub',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-hub.html'
})
export class AdminHubComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);

  stats = signal<IGlobalStats | null>(null);
  users = signal<any[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.adminService.getStats().subscribe(data => this.stats.set(data));
    this.adminService.getUsers().subscribe(data => {
      this.users.set(data);
      this.isLoading.set(false);
    });
  }

  promote(userId: string, username: string) {
    if (confirm(`Promote ${username} to Moderator?`)) {
      this.adminService.promoteToMod(userId).subscribe({
        next: () => {
          this.toast.show(`${username} is now a Moderator`, 'success');
          this.loadData();
        }
      });
    }
  }
}