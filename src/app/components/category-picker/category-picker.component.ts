import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { ItemReorderEventDetail } from '@ionic/core';
import { Subscription } from 'rxjs';
import { Category } from 'src/app/interfaces/category';
import { FirestoreService } from 'src/app/services/firestore.service';
import { ALL_SONGS_SECTION } from 'src/app/constants/sections';

// Selector de categorías para una lista: elegir del catálogo, ordenar y crear nuevas
@Component({
  selector: 'app-category-picker',
  templateUrl: './category-picker.component.html',
  styleUrls: ['./category-picker.component.scss'],
})
export class CategoryPickerComponent implements OnInit, OnDestroy {
  @Input() selected: string[] = [];
  @Output() selectedChange = new EventEmitter<string[]>();

  categories: Category[] = [];
  newCategoryName = '';
  isSaving = false;
  errorMessage = '';
  private categoriesSub?: Subscription;

  constructor(private firestoreService: FirestoreService) { }

  ngOnInit() {
    this.categoriesSub = this.firestoreService.getCategories().subscribe((categories) => {
      this.categories = categories;
    });
  }

  ngOnDestroy() {
    this.categoriesSub?.unsubscribe();
  }

  // Categorías del catálogo que aún no están en la lista
  get available(): Category[] {
    return this.categories.filter(c => !this.selected.includes(c.name));
  }

  add(name: string) {
    if (this.selected.includes(name)) return;
    this.emit([...this.selected, name]);
  }

  remove(name: string) {
    this.emit(this.selected.filter(n => n !== name));
  }

  onReorder(event: CustomEvent<ItemReorderEventDetail>) {
    this.emit(event.detail.complete([...this.selected]));
  }

  // Reordena las categorías elegidas según el orden del catálogo
  applyCatalogOrder() {
    const position = (name: string) => {
      const index = this.categories.findIndex(c => c.name === name);
      return index === -1 ? Number.MAX_SAFE_INTEGER : index;
    };
    this.emit([...this.selected].sort((a, b) => position(a) - position(b)));
  }

  async createCategory() {
    const name = this.newCategoryName.trim();
    this.errorMessage = '';
    if (!name || this.isSaving) return;

    if (name.toLowerCase() === ALL_SONGS_SECTION.toLowerCase()) {
      this.errorMessage = `"${ALL_SONGS_SECTION}" ya está siempre incluida`;
      return;
    }

    const existing = this.categories.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      // Ya existe en el catálogo: solo la agrega a la lista
      this.add(existing.name);
      this.newCategoryName = '';
      return;
    }

    this.isSaving = true;
    try {
      await this.firestoreService.addCategory({ name, order: this.categories.length, createdAt: new Date() });
      this.add(name);
      this.newCategoryName = '';
    } catch (error) {
      console.error('Error adding category:', error);
      this.errorMessage = 'Error al crear la categoría';
    } finally {
      this.isSaving = false;
    }
  }

  private emit(updated: string[]) {
    this.selected = updated;
    this.selectedChange.emit(updated);
  }
}
