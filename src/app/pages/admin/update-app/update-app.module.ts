import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { UpdateAppPageRoutingModule } from './update-app-routing.module';

import { UpdateAppPage } from './update-app.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    UpdateAppPageRoutingModule
  ],
  declarations: [UpdateAppPage]
})
export class UpdateAppPageModule {}
