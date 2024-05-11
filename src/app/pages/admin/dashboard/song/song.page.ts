import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FirestoreService } from 'src/app/services/firestore.service';
import { FormGroup, FormControl } from '@angular/forms';
import { Song } from 'src/app/interfaces/song';

@Component({
  selector: 'app-song',
  templateUrl: './song.page.html',
  styleUrls: ['./song.page.scss'],
})
export class SongPage implements OnInit {
  songForm: FormGroup;
  isEditing: boolean = false; // Control de estado para botón editar
  //Lista visualizacion
  openSections = {
    introduction: false,
    letter1: false,
    interlude: false,
    letter2: false,
    end: false,
    label: false,
  };

  constructor(
    private activatedRoute: ActivatedRoute,
    private firestoreService: FirestoreService
  ) {
    this.songForm = new FormGroup({
      id: new FormControl(''), // Asegúrate de tener un control para el ID si lo vas a necesitar para actualizar
      name: new FormControl(''), // Nombre de la canción
      introduction: new FormControl(''), // Introducción
      letter1: new FormControl(''), // Letra Parte 1
      interlude: new FormControl(''), // Interludio
      letter2: new FormControl(''), // Letra Parte 2
      end: new FormControl(''), // Final
      label: new FormControl(''), // Etiqueta o categoría
    });
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe((params) => {
      const songId = params['id'];
      this.loadSong(songId);
    });
  }

  loadSong(songId: string) {
    this.firestoreService.getSongById(songId).subscribe((song) => {
      if (song) {
        this.songForm.patchValue(song);
      }
    });
  }

  startEditing() {
    this.isEditing = true;
  }

  updateSong() {
    if (this.songForm.invalid) {
      console.error('El formulario no es válido');
      return;
    }
    const updatedData: Partial<Song> = this.songForm.value;

    this.firestoreService
      .updateSong(updatedData.id as string, updatedData)
      .then(() => {
        console.log('Canción actualizada con éxito');
        this.isEditing = false; // Salir del modo edición
      })
      .catch((error) => {
        console.error('Error al actualizar la canción:', error);
      });
  }
}
