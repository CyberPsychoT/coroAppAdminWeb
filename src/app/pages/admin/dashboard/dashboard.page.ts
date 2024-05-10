import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { Song } from 'src/app/interfaces/song';
import { FirestoreService } from 'src/app/services/firestore.service';
import { AlertController, ModalController } from '@ionic/angular';
import { doc, deleteDoc, Firestore } from '@angular/fire/firestore';
import { AddSongComponent } from 'src/app/components/add-song/add-song.component';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  songs: any[] = []; // Inicializa aquí para evitar errores similares
  filteredSongs: any[] = []; // Inicializado como un arreglo vacío
  searchTerm: string = '';
  showCheckboxes: boolean = false;

  constructor(
    private router: Router,
    private auth: AuthService,
    private modalController: ModalController,
    private alertController: AlertController,
    private firestore: FirestoreService,
    private fireStore: Firestore
  ) {
    this.songs = [
      {
        name: '',
        description: '',
      },
    ];
  }

  ngOnInit() {
    this.firestore.getSongs().subscribe((songs) => {
      this.songs = songs.sort((a, b) => a.name.localeCompare(b.name));
      this.filteredSongs = this.songs; // Asegúrate de que las canciones están siendo copiadas correctamente
    });
  }

  //Filtrar canciones
  filterSongs() {
    this.filteredSongs = this.searchTerm
      ? this.songs.filter((song) =>
          song.name.toLowerCase().includes(this.searchTerm.toLowerCase())
        )
      : this.songs;
  }

  //Navegar a la pagina de la cancion con id:
  openSongPage(songId: string) {
    this.router.navigate(['admin/dashboard/song', songId]);
  }

  //Boton para eliminar cancion por id
  async clickDelete(song: Song) {
    const response = await this.firestore.deleteSong(song);
    console.log(response);
  }

  goToAddSong() {
    this.firestore.triggerAddSong(true);
  }

  async openAddSongModal() {
    const modal = await this.modalController.create({
      component: AddSongComponent,
    });
    return await modal.present();
  }

  //Eliminar canciones por mayor

  confirmDelete() {
    this.showCheckboxes = true;
  }

  deleteSelectedSongs() {
    this.songs
      .filter((song) => song.selected)
      .forEach((song) => {
        const songDocRef = doc(this.fireStore, `songs/${song.id}`);
        deleteDoc(songDocRef)
          .then(() => {
            console.log(`Deleted song: ${song.name}`);
          })
          .catch((error: any) => {
            console.error('Error deleting song:', error);
          });
      });

    // Después de eliminar las canciones, ocultamos los checkboxes nuevamente
    this.showCheckboxes = false;
  }
  cancelSelectedSongs() {
    this.filteredSongs.forEach((song) => (song.selected = false));
    this.showCheckboxes = false; // También ocultamos los checkboxes
  }
}
