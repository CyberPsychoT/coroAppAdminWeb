import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { FirestoreService } from 'src/app/services/firestore.service';

@Component({
  selector: 'app-add-list',
  templateUrl: './add-list.component.html',
  styleUrls: ['./add-list.component.scss'],
})
export class AddListComponent implements OnInit {
  formAddList: FormGroup;

  constructor(private router: Router, private firestore: FirestoreService) {
    this.formAddList = new FormGroup({
      name: new FormControl('', Validators.required),
      songs: new FormControl([]), // Se cambió 'songIds' a 'songs' para coincidir con la interfaz
      createdAt: new FormControl(new Date()),
      selected: new FormControl(false),
    });
  }

  ngOnInit() {}

  async onSubmit() {
    if (this.formAddList.invalid) {
      this.formAddList.markAllAsTouched(); // Muestra errores si el formulario es inválido
      return;
    }

    const newList = this.formAddList.value;
    console.log(newList);
    const response = await this.firestore.addList(newList);
    if (response) {
      console.log('List added with ID:', response.id);
      this.router.navigate(['admin/list-week']);
    } else {
      console.error('Failed to add List');
    }
  }

  goToListWeek() {
    this.formAddList.reset();
    this.router.navigate(['admin/list-week']);
  }
}
