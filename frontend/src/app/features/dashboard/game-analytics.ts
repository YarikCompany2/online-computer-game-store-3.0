import { Component, OnInit, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard';
import { ToastService } from '../../core/services/toast';
import { HttpClient } from '@angular/common/http';
import Chart from 'chart.js/auto';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-game-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './game-analytics.html'
})
export class GameAnalyticsComponent implements OnInit {
  @ViewChild('salesChart') chartCanvas?: ElementRef;
  
  private route = inject(ActivatedRoute);
  private dashService = inject(DashboardService);
  private toast = inject(ToastService);
  private http = inject(HttpClient);
  
  gameId: string = '';
  data = signal<any>(null);
  activeMetric = signal<'units' | 'revenue'>('units');
  minDate = signal(new Date().toISOString().split('T')[0]);
  
  saleMode = signal<'global' | 'personal'>('global');
  availableDiscounts = signal<any[]>([]);
  selectedDiscountId: string | null = null;
  isApplying = signal(false);

  isTerminateModalOpen = signal(false);

  customSale = {
    name: '',
    percent: 10,
    endDate: ''
  };

  private chart: any;
  totalUnits = signal(0);
  totalRevenue = signal(0);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.gameId = id;
      this.loadGameStats();
      this.loadDiscounts();
    }
  }

  loadGameStats() {
    this.dashService.getGameDetailStats(this.gameId).subscribe({
      next: (res) => {
        this.data.set(res);
        const units = res.history.reduce((sum: number, h: any) => sum + h.count, 0);
        const rev = res.history.reduce((sum: number, h: any) => sum + h.revenue, 0);
        this.totalUnits.set(units);
        this.totalRevenue.set(rev);
        setTimeout(() => this.initChart(), 0);
      }
    });
  }

  loadDiscounts() {
    this.dashService.getAvailableDiscounts().subscribe(res => {
      this.availableDiscounts.set(res);
    });
  }

  applyGlobalDiscount() {
    if (!this.selectedDiscountId) return;

    this.isApplying.set(true);
    this.dashService.applyDiscount(this.gameId, this.selectedDiscountId).subscribe({
      next: () => {
        this.toast.show('Global discount synchronized', 'success');
        this.isApplying.set(false);
        this.loadGameStats();
      },
      error: () => {
        this.toast.show('Failed to apply discount', 'error');
        this.isApplying.set(false);
      }
    });
  }

  launchPersonalSale() {
    if (!this.customSale.name || !this.customSale.endDate) {
      this.toast.show('Incomplete sale parameters', 'error');
      return;
    }

    const selectedDate = new Date(this.customSale.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate <= today) {
      this.toast.show('Expiration date must be at least tomorrow', 'error');
      return;
    }

    this.isApplying.set(true);
    const payload = {
      ...this.customSale,
      discountPercent: this.customSale.percent,
      startDate: new Date(),
      gameId: this.gameId
    };

    this.http.post('http://localhost:3000/discounts/personal', payload).subscribe({
      next: () => {
        this.toast.show(`Personal sale "${this.customSale.name}" is now LIVE!`, 'success');
        this.isApplying.set(false);
        this.loadGameStats();
        this.saleMode.set('global');
      },
      error: (err) => {
        this.toast.show(err.error?.message || 'Verification failed', 'error');
        this.isApplying.set(false);
      }
    });
  }

  confirmTermination() {
    this.isApplying.set(true);

    this.http.post(`http://localhost:3000/discounts/apply`, { 
      gameId: this.gameId, 
      discountId: null 
    }).subscribe({
      next: () => {
        this.toast.show('Campaign terminated. Price restored.', 'success');
        this.loadGameStats();
        this.isApplying.set(false);
        this.isTerminateModalOpen.set(false);
      },
      error: () => {
        this.toast.show('Server error: termination failed', 'error');
        this.isApplying.set(false);
      }
    });
  }

  toggleMetric(m: 'units' | 'revenue') {
    this.activeMetric.set(m);
    this.initChart();
  }

  initChart() {
    if (!this.chartCanvas) return;
    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    const history = this.data().history;
    const metric = this.activeMetric();
    const themeColor = metric === 'units' ? '#66c0f4' : '#a4d007';

    if (this.chart) this.chart.destroy();
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: history.map((h: any) => new Date(h.date).toLocaleDateString()),
        datasets: [{
          data: history.map((h: any) => metric === 'units' ? h.count : h.revenue),
          borderColor: themeColor,
          backgroundColor: `${themeColor}1a`,
          fill: true,
          tension: 0,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: themeColor,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#4e5667', font: { weight: 'bold' } } },
          x: { grid: { display: false }, ticks: { color: '#4e5667', font: { weight: 'bold' } } }
        }
      }
    });
  }

  isFuture(dateString: string): boolean {
    const startDate = new Date(dateString);
    const now = new Date();
    return startDate > now;
  }

  removeDiscount() {
    this.isTerminateModalOpen.set(true);
  }

  preventNegativeAndDot(event: KeyboardEvent) {
    if (['-', '+', 'e', '.'].includes(event.key)) {
      event.preventDefault();
    }
  }
}