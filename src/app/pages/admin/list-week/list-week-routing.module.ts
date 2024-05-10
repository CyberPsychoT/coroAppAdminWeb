import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ListWeekPage } from './list-week.page';

const routes: Routes = [
  {
    path: '',
    component: ListWeekPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ListWeekPageRoutingModule {}
