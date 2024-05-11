import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AddSongComponent } from './add-song/add-song.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AddListComponent } from './add-list/add-list.component';

@NgModule({
  declarations: [AddSongComponent, AddListComponent],
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
  exports: [AddSongComponent, AddListComponent],
})
export class ComponentsModule {}
