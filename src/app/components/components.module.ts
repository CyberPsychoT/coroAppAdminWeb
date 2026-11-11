import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AddSongComponent } from './add-song/add-song.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AddListComponent } from './add-list/add-list.component';
import { CategoryPickerComponent } from './category-picker/category-picker.component';

@NgModule({
  declarations: [AddSongComponent, AddListComponent, CategoryPickerComponent],
  imports: [CommonModule, IonicModule, FormsModule, ReactiveFormsModule],
  exports: [AddSongComponent, AddListComponent, CategoryPickerComponent],
})
export class ComponentsModule {}
