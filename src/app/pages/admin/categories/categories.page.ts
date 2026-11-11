import { Component, OnDestroy, OnInit } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { ItemReorderEventDetail } from '@ionic/core';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';
import { Category } from 'src/app/interfaces/category';
import { FirestoreService } from 'src/app/services/firestore.service';
import { ALL_SONGS_SECTION } from 'src/app/constants/sections';

@Component({
  selector: 'app-categories',
  templateUrl: './categories.page.html',
  styleUrls: ['./categories.page.scss'],
})
export class CategoriesPage implements OnInit, OnDestroy {
  categories: Category[] = [];
  newCategoryName = '';
  isLoading = true;
  isSaving = false;
  private categoriesSub?: Subscription;

  constructor(
    private firestoreService: FirestoreService,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.categoriesSub = this.firestoreService.getCategories().subscribe((categories) => {
      this.categories = categories;
      this.isLoading = false;
    });
  }

  ngOnDestroy() {
    this.categoriesSub?.unsubscribe();
  }

  // Devuelve un mensaje de error si el nombre no es válido, o null si está bien
  private validateName(name: string, current?: Category): string | null {
    if (!name) return 'El nombre no puede estar vacío';
    if (name.toLowerCase() === ALL_SONGS_SECTION.toLowerCase()) {
      return `"${ALL_SONGS_SECTION}" es una sección reservada`;
    }
    const exists = this.categories.some(
      c => c.id !== current?.id && c.name.toLowerCase() === name.toLowerCase()
    );
    return exists ? `La categoría "${name}" ya existe` : null;
  }

  async addCategory() {
    const name = this.newCategoryName.trim();
    if (!name || this.isSaving) return;

    const error = this.validateName(name);
    if (error) {
      this.presentToast(error, 'error');
      return;
    }

    this.isSaving = true;
    try {
      await this.firestoreService.addCategory({ name, order: this.categories.length, createdAt: new Date() });
      this.newCategoryName = '';
      this.presentToast(`✓ Categoría "${name}" creada`, 'success');
    } catch (error) {
      console.error('Error adding category:', error);
      this.presentToast('Error al crear la categoría', 'error');
    } finally {
      this.isSaving = false;
    }
  }

  async renameCategory(category: Category) {
    const result = await Swal.fire({
      title: 'Renombrar categoría',
      text: 'El cambio se aplica también en todas las listas que la usan.',
      input: 'text',
      inputValue: category.name,
      inputAttributes: { maxlength: '60' },
      showCancelButton: true,
      confirmButtonColor: '#ff8c00',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      heightAuto: false,
      customClass: {
        popup: 'custom-swal-popup'
      },
      inputValidator: (value) => this.validateName((value || '').trim(), category) ?? undefined,
    });

    const newName = (result.value || '').trim();
    if (!result.isConfirmed || newName === category.name) return;

    try {
      await this.firestoreService.renameCategory(category, newName);
      this.presentToast(`✓ "${category.name}" ahora se llama "${newName}"`, 'success');
    } catch (error) {
      console.error('Error renaming category:', error);
      this.presentToast('Error al renombrar la categoría', 'error');
    }
  }

  async deleteCategory(category: Category) {
    const usedIn = await this.firestoreService.countListsUsingCategory(category.name);
    const impact = usedIn > 0
      ? `Se quitará de ${usedIn} lista${usedIn !== 1 ? 's' : ''} y sus canciones pasarán a "${ALL_SONGS_SECTION}".`
      : 'Ninguna lista la está usando.';

    const result = await Swal.fire({
      title: `¿Eliminar "${category.name}"?`,
      text: impact,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      heightAuto: false,
      customClass: {
        popup: 'custom-swal-popup'
      }
    });
    if (!result.isConfirmed) return;

    try {
      await this.firestoreService.deleteCategory(category);
      this.presentToast(`Categoría "${category.name}" eliminada`, 'success');
    } catch (error) {
      console.error('Error deleting category:', error);
      this.presentToast('Error al eliminar la categoría', 'error');
    }
  }

  async onReorder(event: CustomEvent<ItemReorderEventDetail>) {
    this.categories = event.detail.complete(this.categories);
    try {
      await this.firestoreService.updateCategoriesOrder(this.categories);
    } catch (error) {
      console.error('Error saving order:', error);
      this.presentToast('Error al guardar el orden', 'error');
    }
  }

  async presentToast(message: string, type: 'success' | 'error' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3500,
      position: 'bottom',
      cssClass: `app-toast toast-${type}`,
      buttons: [{ icon: 'close', role: 'cancel' }]
    });
    await toast.present();
  }

  trackById(index: number, category: Category): string {
    return category.id ?? category.name;
  }
}
