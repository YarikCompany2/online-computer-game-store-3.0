import { Routes } from '@angular/router';
import { CatalogComponent } from './features/catalog/catalog';
import { GameDetailsComponent } from './features/game-details/game-details';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';

export const routes: Routes = [
  { path: '', component: CatalogComponent },
  { path: 'game/:id', component: GameDetailsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
];