import { Component, OnInit } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { deleteDoc, doc } from '@firebase/firestore';
import { FirestoreService } from 'src/app/services/firestore.service';
import { List } from 'src/app/interfaces/list';
import { AlertController, ToastController } from '@ionic/angular';
import { first } from 'rxjs/operators';
import Swal from 'sweetalert2';

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
  ) { }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe((params) => {
      if (params['selectedSongs']) {
        this.selectedSongs = JSON.parse(params['selectedSongs']);
      }
    });

    this.firestore.getLists().subscribe((lists) => {
      this.lists = lists.map(list => {
        // Convertir Timestamp de Firestore a Date de JS si es necesario
        if (list.createdAt && (list.createdAt as any).toDate) {
          list.createdAt = (list.createdAt as any).toDate();
        }
        return list;
      }).sort((a, b) => a.name.localeCompare(b.name));
      this.filteredLists = this.lists;
    });
  }

  // FUNCIÓN PARA OPTIMIZAR EL *ngFor
  trackById(index: number, list: List): string | undefined {
    return list.id;
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

  filterLists() {
    const term = this.normalizeText(this.searchTerm || '');

    this.filteredLists = term
      ? this.lists.filter((list) =>
        this.normalizeText(list.name).includes(term)
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

  async toggleStatus(list: List, event: any) {
    event.stopPropagation(); // Evitar que se abra la lista al hacer click en el toggle
    const newStatus = event.detail.checked;
    const updatedList = { ...list, status: newStatus };
    
    try {
      if (list.id) {
        await this.firestore.updateList(list.id, updatedList);
        console.log(`List ${list.name} status updated to ${newStatus}`);
      } else {
        console.error('List ID is missing');
      }
    } catch (error) {
      console.error('Error updating list status:', error);
      // Revertir el cambio visual si falla la actualización
      list.status = !newStatus;
    }
  }

  async editList(list: List, event: any) {
    event.stopPropagation();
    
    // 1. Mostrar Input con SweetAlert2
    const { value: newName } = await Swal.fire({
      title: 'Editar Nombre de Lista',
      input: 'text',
      inputLabel: 'Nuevo nombre',
      inputValue: list.name,
      showCancelButton: true,
      confirmButtonText: 'Guardar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ff8c00', // Primary Orange
      cancelButtonColor: '#d33',
      heightAuto: false, // Recommended for Ionic
      inputValidator: (value) => {
        if (!value) {
          return '¡El nombre no puede estar vacío!';
        }
        return null;
      }
    });

    if (newName && newName !== list.name) {
      this.updateListName(list, newName);
    }
  }

  async updateListName(list: List, newName: string) {
    if (!list.id) return;

    // 2. Mostrar Loading "Cambiando nombre..."
    Swal.fire({
      title: 'Cambiando nombre de la lista...',
      allowOutsideClick: false,
      heightAuto: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });

    try {
      await this.firestore.updateList(list.id, { name: newName });
      
      // 3. Mostrar Éxito (Verde)
      Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: 'Nombre modificado correctamente',
        timer: 2000,
        heightAuto: false,
        showConfirmButton: false
      });
      
    } catch (error) {
      console.error('Error updating list name:', error);
      
      // 4. Mostrar Error (Rojo)
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Hubo un problema al actualizar el nombre',
        heightAuto: false
      });
    }
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
  async presentAddConfirm(listId: string | undefined) {
    if (!listId) return;
    
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
