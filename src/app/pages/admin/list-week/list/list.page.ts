import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FirestoreService } from 'src/app/services/firestore.service';
import { List } from 'src/app/interfaces/list';
import { Song } from 'src/app/interfaces/song';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-list',
  templateUrl: './list.page.html',
  styleUrls: ['./list.page.scss'],
})
export class ListPage implements OnInit {
  list: List | undefined;
  songs: Song[] = [];
  songMap: Map<string, Song> = new Map(); // Usamos un mapa para evitar duplicados
  sections: any[] = [
    { name: 'Todas las Canciones', songs: [] },
    { name: 'Entrada', songs: [] },
    { name: 'Canto de Perdón', songs: [] },
    { name: 'Gloria', songs: [] },
    { name: 'Salmo', songs: [] },
    { name: 'Antes del Evangelio', songs: [] },
    { name: 'Despues del Evangelio', songs: [] },
    { name: 'Ofertorio', songs: [] },
    { name: 'Santo', songs: [] },
    { name: 'Prefacio', songs: [] },
    { name: 'Padre Nuestro', songs: [] },
    { name: 'Cordero', songs: [] },
    { name: 'Comunion', songs: [] },
    { name: 'Canto Final', songs: [] },
  ];

  songSections: { [key: string]: string } = {}; // Mapea songId a sectionName

  constructor(
    private activatedRoute: ActivatedRoute,
    private navCtrl: NavController,
    private firestoreService: FirestoreService
  ) {}

  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      const listId = params['id'];
      this.loadListAndSongs(listId);
    });
  }

  loadListAndSongs(listId: string) {
    this.firestoreService.getListById(listId).subscribe((list) => {
      this.list = list;
      this.loadSongs(list.songIds);
    });
  }

  loadSongs(songIds: string[]) {
    this.songMap.clear(); // Limpia el mapa para asegurarte de que se cargue fresco
    this.songs = []; // Limpia el arreglo de canciones para evitar duplicados

    songIds.forEach((songId) => {
      this.firestoreService.getSongById(songId).subscribe((song) => {
        if (song && song.id) {
          if (!this.songMap.has(song.id)) {
            // Verifica si la canción ya fue cargada
            this.songs.push(song);
            this.songMap.set(song.id, song); // Añade al mapa para evitar duplicados
            this.songSections[song.id] = song.section || 'Todas las Canciones'; // Usa la sección guardada o default
            this.reorganizeSongs();
          }
        }
      });
    });
  }

  assignSongToSection(song: Song, sectionName: string) {
    if (song.id) {
      this.songSections[song.id] = sectionName; // Guarda la asignación en el objeto
      this.firestoreService
        .updateSong(song.id, { section: sectionName }) // Actualiza en la base de datos
        .then(() => {
          console.log('Sección actualizada con éxito');
          this.reorganizeSongs(); // Reorganiza las canciones en las secciones UI
        })
        .catch((error) => {
          console.error('Error updating song:', error);
        });
    }
  }

  reorganizeSongs() {
    this.sections.forEach((section) => (section.songs = [])); // Limpia las secciones
    this.songs.forEach((song) => {
      if (song.id) {
        // Asegúrate de que song.id esté definido
        const sectionName = this.songSections[song.id] || 'Todas las Canciones';
        const section = this.sections.find((sec) => sec.name === sectionName);
        if (section) {
          section.songs.push(song);
        }
      }
    });
  }

  toggleSection(section: any) {
    section.open = !section.open;
  }

  openSongPage(songId: string) {
    if (songId) {
      this.navCtrl.navigateForward(`admin/dashboard/song/${songId}`);
    }
  }
}
