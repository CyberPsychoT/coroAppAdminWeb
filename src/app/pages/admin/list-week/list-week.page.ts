import { Component, OnInit } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { ActivatedRoute, Router } from '@angular/router';
import { deleteDoc, doc } from '@firebase/firestore';
import { FirestoreService } from 'src/app/services/firestore.service';
import { List } from 'src/app/interfaces/list';

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
  //Eliminar canciones por mayor

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

  cancelSelectedLists() {
    this.filteredLists.forEach((list) => (list.selected = false));
    this.showCheckboxes = false;
  }

  //Agregar canciones a lista
  addSongsToList(listId: string) {
    if (!listId) {
      console.error('No list ID provided');
      return;
    }
    this.firestore.getListById(listId).subscribe((list) => {
      let updatedSongIds = list.songIds || [];
      updatedSongIds = [
        ...updatedSongIds,
        ...this.selectedSongs.filter((id) => !updatedSongIds.includes(id)),
      ];
      this.firestore
        .updateSongsInList(listId, updatedSongIds)
        .then(() => {
          console.log('Canciones añadidas con éxito');
        })
        .catch((error) => {
          console.error('Error updating list:', error);
        });
    });
  }
}
