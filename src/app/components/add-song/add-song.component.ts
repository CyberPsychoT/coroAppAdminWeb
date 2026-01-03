import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FirestoreService } from 'src/app/services/firestore.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-add-song',
  templateUrl: './add-song.component.html',
  styleUrls: ['./add-song.component.scss'],
})
export class AddSongComponent implements OnInit {
  formAddSong: FormGroup;

  constructor(private router: Router, private firestore: FirestoreService) {
    this.formAddSong = new FormGroup({
      name: new FormControl('', Validators.required), // Asegúrate de que el nombre no esté vacío
      introduction: new FormControl(''), // Asegúrate de que la descripción no esté vacía
      letter1: new FormControl(''), // Asegúrate de que la descripción no esté vacía
      interlude: new FormControl(''), // Asegúrate de que la descripción no esté vacía
      letter2: new FormControl(''), // Asegúrate de que la descripción no esté vacía
      end: new FormControl(''), // Asegúrate de que la descripción no esté vacía
      label: new FormControl(''), // Asegúrate de que la descripción no esté vacía
    });
  }

  ngOnInit() {}

  async onSubmit() {
    if (this.formAddSong.invalid) {
      this.formAddSong.markAllAsTouched();
      return;
    }

    const songData = {
      ...this.formAddSong.value,
    };

    try {
      const response = await this.firestore.addSong(songData);
      if (response) {
        await Swal.fire({
          title: '¡Guardado!',
          text: 'La canción se ha guardado correctamente.',
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: 'var(--ion-color-primary)',
          heightAuto: false
        });
        this.goToDashboard();
      } else {
        throw new Error('No response from server');
      }
    } catch (error) {
      console.error('Error adding song:', error);
      await Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al guardar la canción.',
        icon: 'error',
        confirmButtonText: 'Intentar de nuevo',
        heightAuto: false
      });
    }
  }

  goToDashboard() {
    this.formAddSong.reset();
    this.router.navigate(['admin/dashboard']);
  }
}
