import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { FirestoreService } from 'src/app/services/firestore.service';

@Component({
  selector: 'app-add-song',
  templateUrl: './add-song.component.html',
  styleUrls: ['./add-song.component.scss'],
})
export class AddSongComponent implements OnInit {
  formAddSong: FormGroup;

  constructor(
    private modalController: ModalController,
    private firestore: FirestoreService
  ) {
    this.formAddSong = new FormGroup({
      name: new FormControl('', Validators.required), // Asegúrate de que el nombre no esté vacío
      introduction: new FormControl(''), // Asegúrate de que la descripción no esté vacía
      letter1: new FormControl('', Validators.required), // Asegúrate de que la descripción no esté vacía
      interlude: new FormControl(''), // Asegúrate de que la descripción no esté vacía
      letter2: new FormControl(''), // Asegúrate de que la descripción no esté vacía
      end: new FormControl(''), // Asegúrate de que la descripción no esté vacía
    });
  }

  ngOnInit() {}

  async onSubmit() {
    console.log(this.formAddSong.value);
    const response = await this.firestore.addSong(this.formAddSong.value);
    if (response) {
      console.log('Song added with ID:', response.id);
      this.modalController.dismiss(); // Cierra el modal si todo va bien
    } else {
      console.error('Failed to add song');
      // Mostrar algún mensaje de error al usuario aquí
    }
  }

  close() {
    this.modalController.dismiss();
  }
}
