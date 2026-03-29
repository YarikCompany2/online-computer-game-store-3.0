import { Routes } from '@angular/router';
import { CatalogComponent } from './features/catalog/catalog';

export const routes: Routes = [
  { path: '', component: CatalogComponent },
  { path: 'catalog', component: CatalogComponent },
];