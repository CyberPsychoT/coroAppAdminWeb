import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FirestoreService } from 'src/app/services/firestore.service';

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
      letter1: new FormControl('', Validators.required), // Asegúrate de que la descripción no esté vacía
      interlude: new FormControl(''), // Asegúrate de que la descripción no esté vacía
      letter2: new FormControl(''), // Asegúrate de que la descripción no esté vacía
      end: new FormControl(''), // Asegúrate de que la descripción no esté vacía
      label: new FormControl('', Validators.required), // Asegúrate de que la descripción no esté vacía
    });
  }

  ngOnInit() {}

  async onSubmit() {
    const songData = {
      ...this.formAddSong.value,
    };

    console.log(songData);
    const response = await this.firestore.addSong(songData);
    if (response) {
      console.log('Song added with ID:', response.id);
      this.router.navigate(['admin/dashboard']); // Decide where to navigate after submission
    } else {
      console.error('Failed to add song');
      // Handle errors appropriately
    }
  }

  goToDashboard() {
    this.formAddSong.reset();
    this.router.navigate(['admin/dashboard']);
  }
}
