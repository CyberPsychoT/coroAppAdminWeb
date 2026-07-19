import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { Song } from 'src/app/interfaces/song';
import { List } from 'src/app/interfaces/list';
import { FirestoreService } from 'src/app/services/firestore.service';
import { AlertController, ToastController } from '@ionic/angular';
import { doc, deleteDoc, Firestore } from '@angular/fire/firestore';
import { AddSongComponent } from 'src/app/components/add-song/add-song.component';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit, OnDestroy {
  songs: any[] = [];
  filteredSongs: any[] = [];
  searchTerm: string = '';
  isLoading = true;

  // ── Selección por long-press ──────────────────────
  isSelecting = false;
  longPressTarget: any = null;
  private longPressTimer: any = null;
  private readonly LONG_PRESS_MS = 450;

  // ── Modal: Agregar a lista ────────────────────────
  showListModal = false;
  lists: List[] = [];
  filteredModalLists: List[] = [];
  listSearchTerm = '';
  isLoadingLists = false;
  private listsSub?: Subscription;

  constructor(
    private router: Router,
    private auth: AuthService,
    private alertController: AlertController,
    private toastController: ToastController,
    private firestore: FirestoreService,
    private fireStore: Firestore
  ) {}

  ngOnInit() {
    this.firestore.getSongs().subscribe((songs) => {
      this.songs = songs.sort((a, b) => a.name.localeCompare(b.name));
      this.filteredSongs = this.songs;
      this.isLoading = false;
    });
  }

  ngOnDestroy() {
    this.listsSub?.unsubscribe();
    this.clearLongPressTimer();
  }

  // ── Optimización ngFor ────────────────────────────
  trackById(index: number, song: any): string {
    return song.id;
  }

  // ── Filtrar canciones ─────────────────────────────
  normalizeText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/gi, '')
      .toLowerCase();
  }

  filterSongs() {
    const term = this.normalizeText(this.searchTerm || '');
    this.filteredSongs = term
      ? this.songs.filter(song => this.normalizeText(song.name).includes(term))
      : this.songs;
  }

  // ── Navegación ────────────────────────────────────
  openSongPage(songId: string) {
    this.router.navigate(['admin/dashboard/song', songId]);
  }

  openAddSongModal() {
    this.router.navigate(['components/add-song']);
  }

  goToLists() {
    this.router.navigate(['admin/list-week']);
  }

  // ── Long-press: Selección ─────────────────────────
  onPointerDown(event: PointerEvent, song: any) {
    // Solo touch o botón primario del mouse
    if (event.button !== 0 && event.pointerType !== 'touch') return;

    this.longPressTarget = song;

    this.clearLongPressTimer();
    this.longPressTimer = setTimeout(() => {
      this.startSelectionWith(song);
      this.longPressTarget = null;
      // Vibrar en móvil si está disponible
      if (navigator.vibrate) {
        navigator.vibrate(40);
      }
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

  startSelectionWith(song: any) {
    this.isSelecting = true;
    song.selected = true;
  }

  onCardClick(song: any) {
    if (this.isSelecting) {
      this.toggleSongSelection(song);
    } else {
      this.openSongPage(song.id);
    }
  }

  toggleSongSelection(song: any) {
    song.selected = !song.selected;
    // Si deselecciona todo, salir del modo selección
    if (this.getSelectedCount() === 0) {
      this.isSelecting = false;
    }
  }

  getSelectedCount(): number {
    return this.songs.filter(s => s.selected).length;
  }

  cancelSelection() {
    this.songs.forEach(song => (song.selected = false));
    this.isSelecting = false;
  }

  // ── Eliminar canciones seleccionadas ─────────────
  deleteSelectedSongs() {
    this.songs
      .filter((song) => song.selected)
      .forEach((song) => {
        const songDocRef = doc(this.fireStore, `songs/${song.id}`);
        deleteDoc(songDocRef)
          .then(() => console.log(`Deleted song: ${song.name}`))
          .catch((error: any) => console.error('Error deleting song:', error));
      });
    this.cancelSelection();
  }

  async presentDeleteConfirm() {
    const selectedCount = this.getSelectedCount();
    if (selectedCount === 0) return;

    const { isConfirmed } = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Seguro que desea eliminar ${selectedCount} canción${selectedCount > 1 ? 'es' : ''}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      heightAuto: false
    });

    if (isConfirmed) {
      this.deleteSelectedSongs();
      await Swal.fire({
        title: '¡Eliminadas!',
        text: 'Las canciones fueron eliminadas correctamente',
        icon: 'success',
        timer: 2000,
        heightAuto: false,
        showConfirmButton: false
      });
    }
  }

  // ── Modal: Agregar a Lista ────────────────────────
  openAddToListModal() {
    if (this.getSelectedCount() === 0) return;

    this.showListModal = true;
    this.listSearchTerm = '';
    this.isLoadingLists = true;

    // Cargar listas solo una vez al abrir el modal
    this.listsSub?.unsubscribe();
    this.listsSub = this.firestore.getLists().pipe(first()).subscribe((lists) => {
      this.lists = lists
        .map(list => {
          if (list.createdAt && (list.createdAt as any).toDate) {
            list.createdAt = (list.createdAt as any).toDate();
          }
          return list;
        })
        .sort((a, b) => a.name.localeCompare(b.name));
      this.filteredModalLists = this.lists;
      this.isLoadingLists = false;
    });
  }

  closeListModal() {
    this.showListModal = false;
    this.listSearchTerm = '';
    this.filteredModalLists = [];
  }

  filterModalLists() {
    const term = this.normalizeText(this.listSearchTerm || '');
    this.filteredModalLists = term
      ? this.lists.filter(list => this.normalizeText(list.name).includes(term))
      : this.lists;
  }

  async addSongsToList(list: List) {
    if (!list.id) return;

    const selectedIds = this.songs
      .filter(s => s.selected)
      .map(s => s.id);

    this.closeListModal();

    try {
      const currentList = await this.firestore.getListById(list.id).pipe(first()).toPromise();
      if (!currentList) return;

      if (!currentList.songs) currentList.songs = [];

      const songsToAdd = selectedIds
        .filter(id => !currentList.songs.some((s: any) => s.songId === id))
        .map(id => ({ songId: id, section: 'Todas las Canciones' }));

      if (songsToAdd.length > 0) {
        const updatedSongs = [...currentList.songs, ...songsToAdd];
        await this.firestore.updateSongsInList(list.id, updatedSongs);
        this.presentToast(songsToAdd.length, list.name, 'success');
      } else {
        this.presentToast(0, list.name, 'info');
      }

      this.cancelSelection();
    } catch (error) {
      console.error('Error adding songs to list:', error);
      this.presentToast(-1, list.name, 'error');
    }
  }

  async presentToast(numSongs: number, listName: string, type: 'success' | 'error' | 'info') {
    const messages = {
      success: `✓ ${numSongs} canción${numSongs !== 1 ? 'es' : ''} añadida${numSongs !== 1 ? 's' : ''} a "${listName}"`,
      error: `Error al añadir canciones a "${listName}"`,
      info: `Las canciones ya estaban en "${listName}"`
    };

    const colors = {
      success: 'var(--ion-color-success, #22c55e)',
      error: 'var(--ion-color-danger, #ef4444)',
      info: 'var(--ion-color-primary)'
    };

    const toast = await this.toastController.create({
      message: messages[type],
      duration: 3500,
      position: 'bottom',
      cssClass: `app-toast toast-${type}`,
      buttons: [{ icon: 'close', role: 'cancel' }]
    });
    await toast.present();
  }
}
