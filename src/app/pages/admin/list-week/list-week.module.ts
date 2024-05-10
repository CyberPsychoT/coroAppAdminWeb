import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ListWeekPageRoutingModule } from './list-week-routing.module';

import { ListWeekPage } from './list-week.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ListWeekPageRoutingModule
  ],
  declarations: [ListWeekPage]
})
export class ListWeekPageModule {}
