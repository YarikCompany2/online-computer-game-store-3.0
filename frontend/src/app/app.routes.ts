import { Routes } from '@angular/router';
import { CatalogComponent } from './features/catalog/catalog';
import { GameDetailsComponent } from './features/game-details/game-details';
import { LoginComponent } from './features/auth/login/login';
import { RegisterComponent } from './features/auth/register/register';
import { LibraryComponent } from './features/library/library';
import { CartComponent } from './features/cart/cart';

export const routes: Routes = [
  { path: '', component: CatalogComponent },
  { path: 'game/:id', component: GameDetailsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'library', component: LibraryComponent },
  { path: 'cart', component: CartComponent },
];