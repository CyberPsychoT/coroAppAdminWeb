import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { canActivate, redirectUnauthorizedTo } from '@angular/fire/auth-guard';
import {
  NoSideMenuGuard,
  ReactivateMenuGuard,
} from './guards/no-side-menu.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth/login',
    pathMatch: 'full',
  },
  {
    path: 'auth/login',
    loadChildren: () =>
      import('./pages/auth/login/login.module').then((m) => m.LoginPageModule),
    canActivate: [NoSideMenuGuard],
  },
  {
    path: 'admin/dashboard',
    loadChildren: () =>
      import('./pages/admin/dashboard/dashboard.module').then(
        (m) => m.DashboardPageModule
      ),
    canActivate: [ReactivateMenuGuard],
  },
  {
    path: 'admin/list-week',
    loadChildren: () =>
      import('./pages/admin/list-week/list-week.module').then(
        (m) => m.ListWeekPageModule
      ),
    ...canActivate(() => redirectUnauthorizedTo(['auth/login'])), // Firebase Auth Guard
    canActivate: [ReactivateMenuGuard], // Tu propio guardia
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
