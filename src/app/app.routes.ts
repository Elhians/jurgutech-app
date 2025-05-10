import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'auth', loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule) },
  { path: 'dashboard', loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule) },
  {
    path: 'coop/sensors/temperature-details',
    loadComponent: () => import('./features/sensors/temperature-details/temperature-details.component').then(c => c.TemperatureDetailsComponent)
  },
  {
    path: 'coop/sensors/water-details',
    loadComponent: () => import('./features/sensors/water-details/water-details.component').then(c => c.WaterDetailsComponent)
  },
  {
    path: 'coop/sensors/food-details',
    loadComponent: () => import('./features/sensors/food-details/food-details.component').then(c => c.FoodDetailsComponent)
  },
  {
    path: 'coop/sensors/humidity-details',
    loadComponent: () => import('./features/sensors/humidity-details/humidity-details.component').then(c => c.HumidityDetailsComponent)
  },
  {
    path: 'coop/sensors/ammonia-details',
    loadComponent: () => import('./features/sensors/ammonia-details/ammonia-details.component').then(c => c.AmmoniaDetailsComponent)
  }
];
