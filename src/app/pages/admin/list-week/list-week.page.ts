import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FirestoreService } from 'src/app/services/firestore.service';
import { List } from 'src/app/interfaces/list';
import { AlertController, ToastController } from '@ionic/angular';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-list-week',
  templateUrl: './list-week.page.html',
  styleUrls: ['./list-week.page.scss'],
})
export class ListWeekPage implements OnInit {
  lists: List[] = [];
  filteredLists: List[] = [];
  searchTerm: string = '';
  isLoading = true;

  // ── Selección por long-press ──────────────────────
  isSelecting = false;
  longPressTarget: any = null;
  private longPressTimer: any = null;
  private readonly LONG_PRESS_MS = 450;

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private firestore: FirestoreService,
  ) { }

  ngOnInit() {
    this.firestore.getLists().subscribe((lists) => {
      this.lists = lists.map(list => {
        if (list.createdAt && (list.createdAt as any).toDate) {
          list.createdAt = (list.createdAt as any).toDate();
        }
        return list;
      }).sort((a, b) => a.name.localeCompare(b.name));
      this.filteredLists = this.lists;
      this.isLoading = false;
    });
  }

  ngOnDestroy() {
    this.clearLongPressTimer();
  }

  // ── Optimización ngFor ────────────────────────────
  trackById(index: number, list: List): string | undefined {
    return list.id;
  }

  // ── Filtrar listas ────────────────────────────────
  normalizeText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/gi, '')
      .toLowerCase();
  }

  filterLists() {
    const term = this.normalizeText(this.searchTerm || '');
    this.filteredLists = term
      ? this.lists.filter(list => this.normalizeText(list.name).includes(term))
      : this.lists;
  }

  // ── Navegación ────────────────────────────────────
  openListPage(listId: string | undefined) {
    if (listId) {
      this.router.navigate(['admin/list-week/list', listId]);
    }
  }

  // ── Long-press: Selección ─────────────────────────
  onPointerDown(event: PointerEvent, list: any) {
    if (event.button !== 0 && event.pointerType !== 'touch') return;

    this.longPressTarget = list;
    this.clearLongPressTimer();
    this.longPressTimer = setTimeout(() => {
      this.startSelectionWith(list);
      this.longPressTarget = null;
      if (navigator.vibrate) navigator.vibrate(40);
    }, this.LONG_PRESS_MS);
  }

  onPointerUp() {
    this.clearLongPressTimer();
    this.longPressTarget = null;
  }

  private clearLongPressTimer() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  }

  startSelectionWith(list: any) {
    this.isSelecting = true;
    list.selected = true;
  }

  onCardClick(list: any) {
    if (this.isSelecting) {
      this.toggleListSelection(list);
    } else {
      this.openListPage(list.id);
    }
  }

  toggleListSelection(list: any) {
    list.selected = !list.selected;
    if (this.getSelectedCount() === 0) {
      this.isSelecting = false;
    }
  }

  getSelectedCount(): number {
    return this.lists.filter(l => l.selected).length;
  }

  cancelSelection() {
    this.lists.forEach(list => (list.selected = false));
    this.isSelecting = false;
  }

  // ── Toggle estado activo/inactivo ─────────────────
  async toggleStatus(list: List, event: any) {
    event.stopPropagation();
    const newStatus = event.detail.checked;
    const updatedList = { ...list, status: newStatus };

    try {
      if (list.id) {
        await this.firestore.updateList(list.id, updatedList);
      }
    } catch (error) {
      console.error('Error updating list status:', error);
      list.status = !newStatus;
    }
  }

  // ── Editar nombre (SweetAlert inline) ────────────
  async editList(list: List, event: any) {
    event.stopPropagation();

    const { value: newName } = await Swal.fire({
      title: 'Editar Nombre',
      input: 'text',
      inputLabel: 'Nuevo nombre',
      inputValue: list.name,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ff8c00',
      cancelButtonColor: '#6b7280',
      heightAuto: false,
      inputValidator: (value) => {
        if (!value || !value.trim()) return '¡El nombre no puede estar vacío!';
        return null;
      }
    });

    if (newName && newName.trim() !== list.name) {
      await this.updateListName(list, newName.trim());
    }
  }

  async updateListName(list: List, newName: string) {
    if (!list.id) return;

    Swal.fire({
      title: 'Cambiando nombre...',
      allowOutsideClick: false,
      heightAuto: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      await this.firestore.updateList(list.id, { name: newName });
      Swal.fire({
        icon: 'success',
        title: '¡Listo!',
        text: 'Nombre actualizado correctamente',
        timer: 2000,
        heightAuto: false,
        showConfirmButton: false
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo actualizar el nombre',
        heightAuto: false
      });
    }
  }

  // ── Crear lista — Modal inline ────────────────────
  async openCreateListModal() {
    const { value: name } = await Swal.fire({
      title: 'Nueva Lista',
      input: 'text',
      inputLabel: 'Nombre de la lista',
      inputPlaceholder: 'Ej: Misa Domingo 27 de julio',
      showCancelButton: true,
      confirmButtonText: 'Crear Lista',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ff8c00',
      cancelButtonColor: '#6b7280',
      heightAuto: false,
      inputValidator: (value) => {
        if (!value || !value.trim()) return '¡El nombre es obligatorio!';
        return null;
      }
    });

    if (name && name.trim()) {
      await this.createList(name.trim());
    }
  }

  async createList(name: string) {
    Swal.fire({
      title: 'Creando lista...',
      allowOutsideClick: false,
      heightAuto: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const newList: List = {
        name,
        songs: [],
        createdAt: new Date(),
        selected: false,
        status: true,
      };

      const response = await this.firestore.addList(newList);

      if (response) {
        Swal.fire({
          icon: 'success',
          title: '¡Lista creada!',
          text: `"${name}" está lista para usar`,
          timer: 2000,
          heightAuto: false,
          showConfirmButton: false
        });
      } else {
        throw new Error('No response from Firestore');
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'No se pudo crear la lista',
        heightAuto: false
      });
    }
  }

  // ── Eliminar listas seleccionadas ─────────────────
  async presentDeleteConfirm() {
    const count = this.getSelectedCount();
    if (count === 0) return;

    const alert = await this.alertController.create({
      header: 'Eliminar listas',
      message: `¿Seguro que deseas eliminar ${count} lista${count > 1 ? 's' : ''}? Esta acción no se puede deshacer.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          cssClass: 'danger-button',
          handler: () => this.deleteSelectedLists(),
        },
      ],
    });

    await alert.present();
  }

  deleteSelectedLists() {
    this.lists
      .filter(list => list.selected)
      .forEach(list => {
        this.firestore
          .deleteList(list)
          .catch(error => console.error('Error deleting list:', error));
      });
    this.cancelSelection();
    this.presentToast('Lista(s) eliminada(s) correctamente');
  }

  async presentToast(message: string, type: 'success' | 'error' = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      cssClass: `app-toast toast-${type}`,
      buttons: [{ icon: 'close', role: 'cancel' }]
    });
    await toast.present();
  }
}
