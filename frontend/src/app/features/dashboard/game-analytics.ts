// src/app/features/dashboard/game-analytics.ts

import { Component, OnInit, inject, signal, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DashboardService } from '../../core/services/dashboard';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-game-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-12 max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500">
      @if (data(); as gameData) {
        <header class="flex justify-between items-start">
          <div>
            <a routerLink="/dashboard" class="text-slate-500 hover:text-emerald-400 uppercase text-[10px] font-black tracking-widest flex items-center gap-2 mb-6 transition-colors group">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="group-hover:-translate-x-1 transition-transform"><path d="m15 18-6-6 6-6"/></svg>
                Back to Hub
            </a>
            <h1 class="text-6xl font-black text-white italic uppercase tracking-tighter">{{ gameData.title }}</h1>
            <p class="text-emerald-500 font-bold uppercase text-[10px] tracking-[0.4em] mt-3">Individual Performance Report</p>
          </div>

          <div class="bg-slate-900/40 border border-white/5 p-6 rounded-3xl text-right">
             <p class="text-slate-500 text-[9px] font-black uppercase tracking-widest mb-1">Current Price</p>
             <p class="text-3xl font-black text-white italic">\${{ gameData.price }}</p>
          </div>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div class="bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20 p-10 rounded-[40px]">
                <p class="text-emerald-500/60 text-[10px] font-black uppercase tracking-widest mb-4">Total Units Sold</p>
                <p class="text-6xl font-black text-white italic leading-none">{{ totalUnits() }}</p>
            </div>
            <div class="bg-gradient-to-br from-indigo-500/10 to-transparent border border-indigo-500/20 p-10 rounded-[40px]">
                <p class="text-indigo-500/60 text-[10px] font-black uppercase tracking-widest mb-4">Total Revenue Generated</p>
                <p class="text-6xl font-black text-white italic leading-none">\${{ totalRevenue() | number:'1.2-2' }}</p>
            </div>
        </div>

        <div class="bg-slate-900/40 border border-white/5 p-10 rounded-[48px] backdrop-blur-xl">
          <div class="flex justify-between items-center mb-12">
            <h3 class="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em]">Sales & Revenue Timeline</h3>
            <div class="flex bg-black/40 p-1 rounded-xl border border-white/5">
                <button (click)="toggleMetric('units')" [class.bg-emerald-600]="activeMetric() === 'units'" class="px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all">Units</button>
                <button (click)="toggleMetric('revenue')" [class.bg-emerald-600]="activeMetric() === 'revenue'" class="px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all">Revenue</button>
            </div>
          </div>
          <div class="h-[400px] relative">
            <canvas #salesChart></canvas>
          </div>
        </div>
      } @else {
        <div class="flex justify-center py-40">
           <div class="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      }
    </div>
  `
})
export class GameAnalyticsComponent implements OnInit {
  @ViewChild('salesChart') chartCanvas?: ElementRef;
  
  private route = inject(ActivatedRoute);
  private dashboardService = inject(DashboardService);
  
  data = signal<any>(null);
  activeMetric = signal<'units' | 'revenue'>('units');
  private chart: any;

  totalUnits = signal(0);
  totalRevenue = signal(0);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.dashboardService.getGameDetailStats(id).subscribe({
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

    if (this.chart) this.chart.destroy();

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: history.map((h: any) => new Date(h.date).toLocaleDateString()),
        datasets: [{
          label: metric === 'units' ? 'Copies Sold' : 'Revenue ($)',
          data: history.map((h: any) => metric === 'units' ? h.count : h.revenue),
          borderColor: metric === 'units' ? '#10b981' : '#818cf8',
          backgroundColor: metric === 'units' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(129, 140, 248, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 4,
          pointRadius: 6,
          pointBackgroundColor: metric === 'units' ? '#10b981' : '#818cf8',
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { 
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.05)' }, 
            ticks: { 
                color: '#64748b',
                stepSize: metric === 'units' ? 1 : undefined,
                callback: (value) => metric === 'revenue' ? '$' + value : value
            } 
          },
          x: { grid: { display: false }, ticks: { color: '#64748b' } }
        }
      }
    });
  }
}