import { Component, OnInit } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { deleteDoc, doc } from '@firebase/firestore';
import { FirestoreService } from 'src/app/services/firestore.service';
import { List } from 'src/app/interfaces/list';
import { AlertController, ToastController } from '@ionic/angular';
import { first } from 'rxjs/operators';

@Component({
  selector: 'app-list-week',
  templateUrl: './list-week.page.html',
  styleUrls: ['./list-week.page.scss'],
})
export class ListWeekPage implements OnInit {
  lists: List[] = [];
  filteredLists: List[] = [];
  searchTerm: string = '';
  showCheckboxes: boolean = false;
  selectedSongs: string[] = [];

  constructor(
    private router: Router,
    private alertController: AlertController,
    private toastController: ToastController,
    private firestore: FirestoreService,
    private activatedRoute: ActivatedRoute
  ) {}
  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params['selectedSongs']) {
        this.selectedSongs = JSON.parse(params['selectedSongs']);
      }
    });

    this.firestore.getLists().subscribe((lists) => {
      this.lists = lists.sort((a, b) => a.name.localeCompare(b.name));
      this.filteredLists = this.lists;
    });
  }
  //Filtrar canciones
  filterLists() {
    this.filteredLists = this.searchTerm
      ? this.lists.filter((list) =>
          list.name.toLowerCase().includes(this.searchTerm.toLowerCase())
        )
      : this.lists;
  }

  //Navegar a la pagina de la cancion con id:
  openListPage(listId: string | undefined) {
    if (listId) {
      this.router.navigate(['admin/list-week/list', listId]);
    } else {
      console.log('Error: List ID is undefined');
    }
  }

  //Boton para eliminar cancion por id
  async clickDelete(list: List) {
    const response = await this.firestore.deleteList(list);
    console.log(response);
  }

  openAddList() {
    this.router.navigate(['components/add-list']); // Make sure this route matches your actual route configuration
  }
  //Eliminar listas por mayor

  confirmDelete() {
    this.showCheckboxes = true;
  }

  deleteSelectedLists() {
    // Implementing deletion logic here, note that it's `deleteSelectedLists` by context
    this.lists
      .filter((list) => list.selected)
      .forEach((list) => {
        this.firestore
          .deleteList(list)
          .then(() => {
            console.log(`Deleted list: ${list.name}`);
          })
          .catch((error) => {
            console.error('Error deleting list:', error);
          });
      });
    this.showCheckboxes = false;
  }
  //Aletar para la confirmacion

  async presentDeleteConfirm() {
    const alert = await this.alertController.create({
      header: 'Confirmar Eliminación',
      message:
        '¿Estás seguro de que quieres eliminar las listas seleccionadas?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            console.log('Eliminación cancelada');
          },
        },
        {
          text: 'Eliminar',
          handler: () => {
            this.deleteSelectedLists(); // Llamar a la función de eliminación si el usuario confirma
            console.log('Listas eliminadas');
          },
        },
      ],
    });

    await alert.present();
  }

  cancelSelectedLists() {
    this.filteredLists.forEach((list) => (list.selected = false));
    this.showCheckboxes = false;
  }

  //Agregar canciones a lista
  async presentAddConfirm(listId: string) {
    const alert = await this.alertController.create({
      header: 'Confirmar adición',
      message: '¿Deseas agregar las canciones seleccionadas a esta lista?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            console.log('Adición cancelada');
          },
        },
        {
          text: 'Confirmar',
          handler: () => {
            this.addSongsToList(listId); // Llama a addSongsToList solo si confirma
          },
        },
      ],
    });

    await alert.present();
  }

  async addSongsToList(listId: string) {
    if (!listId) {
      console.error('No list ID provided');
      return;
    }
    this.firestore
      .getListById(listId)
      .pipe(first())
      .subscribe(async (list) => {
        if (!list.songs) list.songs = [];

        const songsToAdd = this.selectedSongs
          .filter((id) => !list.songs.some((song) => song.songId === id))
          .map((id) => ({ songId: id, section: 'Todas las Canciones' }));

        if (songsToAdd.length > 0) {
          const updatedSongs = [...list.songs, ...songsToAdd];

          this.firestore
            .updateSongsInList(listId, updatedSongs)
            .then(async () => {
              console.log('Canciones añadidas con éxito');
              await this.presentToast(songsToAdd.length);
            })
            .catch((error) => {
              console.error('Error updating list:', error);
            });
        } else {
          console.log('No hay nuevas canciones para agregar.');
        }
      });
  }

  async presentToast(numSongs: number) {
    const toast = await this.toastController.create({
      message: `Se agregaron ${numSongs} canción(es) a la lista.`,
      duration: 2000,
    });
    toast.present();
  }
}
