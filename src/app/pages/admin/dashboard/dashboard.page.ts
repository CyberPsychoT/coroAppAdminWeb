import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { Song } from 'src/app/interfaces/song';
import { FirestoreService } from 'src/app/services/firestore.service';
import { AlertController, ModalController } from '@ionic/angular';
import { doc, deleteDoc, Firestore } from '@angular/fire/firestore';
import { AddSongComponent } from 'src/app/components/add-song/add-song.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  songs: any[] = []; // Inicializa aquí para evitar errores similares
  filteredSongs: any[] = []; // Inicializado como un arreglo vacío
  searchTerm: string = '';
  selectedSongs: string[] = [];
  showConfirmationButtons = false; // Controla la visibilidad de los botones de confirmar y volver

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
        introduction: '',
        letter1: '',
        interlude: '',
        letter2: '',
        end: '',
        label: '',
      },
    ];
  }

  ngOnInit() {
    this.firestore.getSongs().subscribe((songs) => {
      this.songs = songs.sort((a, b) => a.name.localeCompare(b.name));
      this.filteredSongs = this.songs;
    });
  }

  // NUEVA FUNCIÓN PARA OPTIMIZAR EL *ngFor
  // Esta función ayuda a Angular a identificar qué elementos de la lista han cambiado,
  // mejorando el rendimiento al evitar que se vuelvan a renderizar todos los elementos.
  trackById(index: number, song: any): string {
    return song.id;
  }

  // Filtrar canciones
  // Elimina acentos y convierte a minúsculas
  normalizeText(text: string): string {
    return text
      .normalize('NFD')                    // separa letras y tildes (e.g. "á" => "á")
      .replace(/[\u0300-\u036f]/g, '')    // elimina las tildes
      .replace(/[^a-z0-9\s]/gi, '')       // elimina otros signos como comas, puntos, etc.
      .toLowerCase();
  }

  filterSongs() {
    const term = this.normalizeText(this.searchTerm || '');

    this.filteredSongs = term
      ? this.songs.filter(song =>
        this.normalizeText(song.name).includes(term)
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

  openAddSongModal() {
    // Navigate to the AddSongComponent
    this.router.navigate(['components/add-song']); // Make sure this route matches your actual route configuration
  }

  //Eliminar canciones por mayor

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
    // Opcional: Ocultar los botones después de la eliminación
    this.showConfirmationButtons = false;
  }

  //Boton confirmar eliminacion
  async presentDeleteConfirm() {
    const selectedCount = this.songs.filter((s) => s.selected).length;
    
    if (selectedCount === 0) {
      return;
    }

    const { isConfirmed } = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Seguro que desea eliminar ${selectedCount} cantidad de canciones?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      heightAuto: false
    });

    if (isConfirmed) {
      this.deleteSelectedSongs();
      
      await Swal.fire({
        title: '¡Eliminadas!',
        text: 'Eliminadas perfectamente',
        icon: 'success',
        heightAuto: false
      });
    }
  }

  cancelSelectedSongs() {
    this.filteredSongs.forEach((song) => (song.selected = false));
    // Ocultar los botones al cancelar
    this.showConfirmationButtons = false;
  }

  toggleConfirmationButtons() {
    this.showConfirmationButtons = !this.showConfirmationButtons;
  }

  //Agregar canciones a lista
  showLists() {
    this.selectedSongs = this.songs
      .filter((song) => song.selected)
      .map((song) => song.id);
    this.router.navigate(['admin/list-week'], {
      queryParams: { selectedSongs: JSON.stringify(this.selectedSongs) },
    });
  }
}
