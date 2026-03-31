import { Routes } from '@angular/router';
import { CatalogComponent } from './features/catalog/catalog';
import { GameDetailsComponent } from './features/game-details/game-details';

export const routes: Routes = [
  { path: '', component: CatalogComponent },
  { path: 'catalog', component: CatalogComponent },
  { path: 'game/:id', component: GameDetailsComponent }, 
];