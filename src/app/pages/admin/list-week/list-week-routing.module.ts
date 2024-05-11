import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ListWeekPage } from './list-week.page';

const routes: Routes = [
  {
    path: '',
    component: ListWeekPage,
  },
  {
    path: 'list/:id',
    loadChildren: () =>
      import('./list/list.module').then((m) => m.ListPageModule),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ListWeekPageRoutingModule {}
