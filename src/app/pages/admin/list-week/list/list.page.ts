import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FirestoreService } from 'src/app/services/firestore.service';
import { List } from 'src/app/interfaces/list';
import { Song } from 'src/app/interfaces/song';
import { ListSong } from 'src/app/interfaces/list-song';
import { NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { switchMap, debounceTime, map, tap } from 'rxjs/operators';
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

  constructor(
    private activatedRoute: ActivatedRoute,
    private navCtrl: NavController,
    private location: Location,
    private firestoreService: FirestoreService
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
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
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

    // Actualiza la UI primero para una respuesta instantánea
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
      if (newSection) {
        newSection.songs.push(songToMove);
      }
    }

    // Actualiza Firestore en segundo plano
    const listSongIndex = this.list.songs.findIndex(ls => ls.songId === songId);
    if (listSongIndex > -1) {
      this.list.songs[listSongIndex].section = newSectionName;
      this.firestoreService.updateList(this.list.id, { songs: this.list.songs });
    }
  }

  hideSong(songId: string) {
    if (this.list && this.list.id) {
      // Elimina de la UI
      this.sections.forEach(section => {
        section.songs = section.songs.filter((s: Song) => s.id !== songId);
      });
      // Elimina de la lista local y actualiza Firestore
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

  trackBySectionName(index: number, section: any): string {
    return section.name;
  }

  trackBySongId(index: number, song: Song): string {
    return song.id ?? '';
  }

}
