import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './core/components/sidebar/sidebar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  template: `
  <div class="flex h-screen bg-[#020617] text-white overflow-hidden">
    <app-sidebar class="w-64 h-full flex-shrink-0"></app-sidebar>

    <div class="flex-1 flex flex-col overflow-y-auto">
      
      <header class="p-6 sticky top-0 bg-[#020617] z-50">
        <div class="max-w-4xl mx-auto relative">
          <input type="text" 
                placeholder="Search for games..." 
                class="w-full bg-slate-900 border border-indigo-500/30 rounded-full py-3 px-12 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-xl">
          <span class="absolute left-5 top-3.5 opacity-50">🔍</span>
        </div>
      </header>

      <main class="flex-1 relative z-10">
        <router-outlet></router-outlet>
      </main>
      
    </div>
  </div>
  `
})
export class App {}