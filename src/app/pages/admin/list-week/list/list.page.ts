import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FirestoreService } from 'src/app/services/firestore.service';
import { List } from 'src/app/interfaces/list';
import { Song } from 'src/app/interfaces/song';
import { ListSong } from 'src/app/interfaces/list-song';
import { NavController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { switchMap, first, map, tap } from 'rxjs/operators';
import { Location } from '@angular/common';

@Component({
  selector: 'app-list',
  templateUrl: './list.page.html',
  styleUrls: ['./list.page.scss'],
})
export class ListPage implements OnInit, OnDestroy {
  list: List | undefined;
  private routeSub!: Subscription;
  sections: any[] = [];

  // ── Modal: Agregar canciones ──────────────────────
  showSongsModal = false;
  allSongs: any[] = [];
  filteredModalSongs: any[] = [];
  songSearchTerm = '';
  isLoadingSongs = false;
  private songsSub?: Subscription;

  constructor(
    private activatedRoute: ActivatedRoute,
    private navCtrl: NavController,
    private location: Location,
    private firestoreService: FirestoreService,
    private toastController: ToastController
  ) { }

  ngOnInit() {
    this.routeSub = this.activatedRoute.params
      .pipe(
        map(params => params['id']),
        switchMap(listId => this.firestoreService.getListById(listId)),
        tap(list => {
          this.list = list;
          this.initializeAndLoadSongs(list.songs || []);
        })
      )
      .subscribe();
  }

  ngOnDestroy() {
    if (this.routeSub) this.routeSub.unsubscribe();
    this.songsSub?.unsubscribe();
  }

  initializeAndLoadSongs(listSongs: ListSong[]) {
    this.initializeSections();
    listSongs.forEach(listSong => {
      this.firestoreService.getSongById(listSong.songId).subscribe((song: Song) => {
        if (song) {
          const section = this.sections.find(sec => sec.name === listSong.section);
          if (section) {
            section.songs.push({ ...song, section: listSong.section });
          }
        }
      });
    });
  }

  initializeSections() {
    this.sections = [
      { name: 'Todas las Canciones', songs: [], open: true },
      { name: 'Entrada', songs: [], open: false },
      { name: 'Canto de Perdón', songs: [], open: false },
      { name: 'Gloria', songs: [], open: false },
      { name: 'Salmo', songs: [], open: false },
      { name: 'Antes del Evangelio', songs: [], open: false },
      { name: 'Después del Evangelio', songs: [], open: false },
      { name: 'Ofertorio', songs: [], open: false },
      { name: 'Santo', songs: [], open: false },
      { name: 'Prefacio', songs: [], open: false },
      { name: 'Padre Nuestro', songs: [], open: false },
      { name: 'Canto de paz', songs: [], open: false },
      { name: 'Cordero', songs: [], open: false },
      { name: 'Comunión', songs: [], open: false },
      { name: 'Canto Final', songs: [], open: false },
    ];
  }

  assignSongToSection(songId: string, newSectionName: string) {
    if (!this.list || !this.list.id) return;

    let songToMove: any;
    this.sections.forEach(oldSection => {
      const songIndex = oldSection.songs.findIndex((s: Song) => s.id === songId);
      if (songIndex > -1) {
        songToMove = oldSection.songs.splice(songIndex, 1)[0];
      }
    });

    if (songToMove) {
      songToMove.section = newSectionName;
      const newSection = this.sections.find(sec => sec.name === newSectionName);
      if (newSection) newSection.songs.push(songToMove);
    }

    const listSongIndex = this.list.songs.findIndex(ls => ls.songId === songId);
    if (listSongIndex > -1) {
      this.list.songs[listSongIndex].section = newSectionName;
      this.firestoreService.updateList(this.list.id, { songs: this.list.songs });
    }
  }

  hideSong(songId: string) {
    if (this.list && this.list.id) {
      this.sections.forEach(section => {
        section.songs = section.songs.filter((s: Song) => s.id !== songId);
      });
      this.list.songs = this.list.songs.filter(ls => ls.songId !== songId);
      this.firestoreService.updateList(this.list.id, { songs: this.list.songs });
    }
  }

  toggleSection(section: any) {
    section.open = !section.open;
  }

  openSongPage(songId: string) {
    if (songId) {
      this.navCtrl.navigateForward(`admin/dashboard/song/${songId}`);
    }
  }

  goBack() {
    this.location.back();
  }

  // ── Modal: Agregar canciones desde lista ──────────
  openAddSongsModal() {
    this.showSongsModal = true;
    this.songSearchTerm = '';
    this.isLoadingSongs = true;

    this.songsSub?.unsubscribe();
    this.songsSub = this.firestoreService.getSongs().pipe(first()).subscribe((songs) => {
      this.allSongs = songs
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(s => ({ ...s, modalSelected: false }));
      this.filteredModalSongs = this.allSongs;
      this.isLoadingSongs = false;
    });
  }

  closeAddSongsModal() {
    this.showSongsModal = false;
    this.songSearchTerm = '';
    // Limpiar selección del modal
    this.allSongs.forEach(s => (s.modalSelected = false));
    this.filteredModalSongs = [];
  }

  normalizeText(text: string): string {
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/gi, '')
      .toLowerCase();
  }

  filterModalSongs() {
    const term = this.normalizeText(this.songSearchTerm || '');
    this.filteredModalSongs = term
      ? this.allSongs.filter(s => this.normalizeText(s.name).includes(term))
      : this.allSongs;
  }

  isSongInList(songId: string): boolean {
    return this.list?.songs?.some(ls => ls.songId === songId) ?? false;
  }

  toggleModalSong(song: any) {
    if (this.isSongInList(song.id)) return; // No se puede seleccionar si ya está
    song.modalSelected = !song.modalSelected;
  }

  getModalSelectedCount(): number {
    return this.allSongs.filter(s => s.modalSelected).length;
  }

  async confirmAddSongs() {
    if (!this.list || !this.list.id) return;

    const selected = this.allSongs.filter(s => s.modalSelected);
    if (selected.length === 0) return;

    const songsToAdd: ListSong[] = selected
      .filter(s => !this.isSongInList(s.id))
      .map(s => ({ songId: s.id, section: 'Todas las Canciones' }));

    if (songsToAdd.length === 0) {
      this.closeAddSongsModal();
      return;
    }

    const updatedSongs = [...(this.list.songs || []), ...songsToAdd];

    try {
      await this.firestoreService.updateSongsInList(this.list.id, updatedSongs);
      this.closeAddSongsModal();
      this.presentToast(`✓ ${songsToAdd.length} canción${songsToAdd.length !== 1 ? 'es' : ''} añadida${songsToAdd.length !== 1 ? 's' : ''} correctamente`, 'success');
    } catch (error) {
      console.error('Error adding songs:', error);
      this.presentToast('Error al añadir las canciones', 'error');
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

  trackBySectionName(index: number, section: any): string {
    return section.name;
  }

  trackBySongId(index: number, song: Song): string {
    return song.id ?? '';
  }
}
