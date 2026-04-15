import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../core/services/admin';
import { ToastService } from '../../core/services/toast';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';

@Component({
  selector: 'app-admin-hub',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-hub.html'
})
export class AdminHubComponent implements OnInit {
  private adminService = inject(AdminService);
  private toast = inject(ToastService);
  private searchSubject = new Subject<string>();

  stats = signal<any>(null);

  isStaffModalOpen = signal(false);
  isProcessing = signal(false);
  targetUser = signal<any | null>(null);
  modalMode = signal<'promote' | 'demote'>('promote');
  
  userSearchQuery = signal('');
  searchResults = signal<any[]>([]);
  isSearching = signal(false);
  
  discounts = signal<any[]>([]);
  isSavingDiscount = signal(false);

  minDate = signal(new Date().toISOString().split('T')[0]);

  newDiscount = {
    name: '',
    discountPercent: 10,
    startDate: '',
    endDate: ''
  };

  ngOnInit() {
    this.loadStats();
    this.loadDiscounts();

    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      switchMap(query => {
        this.isSearching.set(true);
        return this.adminService.searchUsers(query);
      })
    ).subscribe(results => {
      this.searchResults.set(results);
      this.isSearching.set(false);
    });
  }

  loadStats() {
    this.adminService.getStats().subscribe(data => this.stats.set(data));
  }

  loadDiscounts() {
    this.adminService.getGlobalDiscounts().subscribe({
      next: (res) => {
        console.log('API RESPONSE (DISCOUNTS):', res);
        this.discounts.set(res);
      },
      error: (err) => console.error('Failed to load discounts:', err)
    });
  }

  saveGlobalDiscount() {
    if (!this.newDiscount.name || !this.newDiscount.startDate || !this.newDiscount.endDate) {
      this.toast.show('Please fill all fields', 'error');
      return;
    }
    
    this.isSavingDiscount.set(true);
    this.adminService.createGlobalDiscount(this.newDiscount).subscribe({
      next: () => {
        this.toast.show('Global event created!', 'success');
        this.loadDiscounts();
        this.isSavingDiscount.set(false);
        this.newDiscount = { name: '', discountPercent: 10, startDate: '', endDate: '' };
      }
    });
  }

  toggleStatus(id: string) {
    this.adminService.toggleDiscount(id).subscribe(() => {
      this.loadDiscounts();
      this.toast.show('Discount status updated', 'success');
    });
  }

  removeDiscount(id: string) {
    if (confirm('Delete this event permanently?')) {
      this.adminService.deleteDiscount(id).subscribe(() => {
        this.loadDiscounts();
        this.toast.show('Event removed', 'success');
      });
    }
  }

  onSearchInput(val: string) {
    this.userSearchQuery.set(val);
    this.searchSubject.next(val);
  }

  promote(userId: string, username: string) {
    this.adminService.promoteToMod(userId).subscribe({
      next: () => {
        this.toast.show(`${username} promoted to Moderator`, 'success');
        this.loadStats();
        this.searchResults.set([]);
        this.userSearchQuery.set('');
      }
    });
  }

  openStaffModal(user: any, mode: 'promote' | 'demote') {
    this.targetUser.set(user);
    this.modalMode.set(mode);
    this.isStaffModalOpen.set(true);
  }

  closeStaffModal() {
    this.isStaffModalOpen.set(false);
    this.targetUser.set(null);
  }

  confirmStaffChange() {
    const user = this.targetUser();
    const mode = this.modalMode();
    if (!user) return;

    this.isProcessing.set(true);
    
    const request = mode === 'promote' 
      ? this.adminService.promoteToMod(user.id)
      : this.adminService.demoteFromMod(user.id);

    request.subscribe({
      next: () => {
        this.toast.show(`${user.username} role updated`, 'success');
        this.loadStats();
        
        this.searchResults.update(list => list.map(u => 
          u.id === user.id ? { ...u, role: mode === 'promote' ? 'moderator' : 'user' } : u
        ));

        this.isProcessing.set(false);
        this.closeStaffModal();
      },
      error: (err) => {
        this.toast.show(err.error?.message || 'Action failed', 'error');
        this.isProcessing.set(false);
      }
    });
  }

  getMinEndDate(): string {
    return this.newDiscount.startDate || this.minDate();
  }

  getDiscountStatus(d: any): 'Online' | 'Scheduled' | 'Expired' | 'Disabled' {
    if (!d.isActive) return 'Disabled';
    
    const now = new Date().getTime();
    const start = new Date(d.startDate).getTime();
    const end = new Date(d.endDate).getTime();

    if (now < start) return 'Scheduled';
    if (now > end) return 'Expired';
    return 'Online';
  }

  preventNegativeAndDot(event: KeyboardEvent) {
    if (['-', '+', 'e', '.'].includes(event.key)) {
      event.preventDefault();
    }
  }

  demote(userId: string, username: string) {
    if (confirm(`Are you sure you want to remove moderator rights from ${username}?`)) {
      this.adminService.demoteFromMod(userId).subscribe({
        next: () => {
          this.toast.show(`${username} is no longer a Moderator`, 'success');
          this.loadStats();
          this.onSearchInput(this.userSearchQuery());
        },
        error: (err) => this.toast.show('Failed to demote user', 'error')
      });
    }
  }
}