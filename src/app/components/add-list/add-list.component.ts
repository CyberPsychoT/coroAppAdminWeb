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
      description: new FormControl(''),
      songIds: new FormControl([]), // Inicializa como array vacío, los IDs de canciones se añadirán después
      createdAt: new FormControl(new Date()), // Fecha actual, no necesitas un input para esto
      selected: new FormControl(false), // Valor predeterminado false, no es manejado por formulario
    });
  }

  ngOnInit() {}

  async onSubmit() {
    if (this.formAddList.valid) {
      const newList = this.formAddList.value;
      console.log(newList);
      const response = await this.firestore.addList(newList); // Asegúrate de que existe este método
      if (response) {
        console.log('List added with ID:', response.id);
        this.router.navigate(['admin/list-week']);
      } else {
        console.error('Failed to add List');
      }
    }
  }

  goToListWeek() {
    this.formAddList.reset();
    this.router.navigate(['admin/list-week']);
  }
}
