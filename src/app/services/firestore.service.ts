import { Injectable } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  doc,
  deleteDoc,
  docData,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Song } from '../interfaces/song';
import { List } from '../interfaces/list';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  //Boton add-song
  private openAddSong = new Subject<boolean>();
  // Observable que los componentes pueden suscribirse
  openAddSong$ = this.openAddSong.asObservable();

  constructor(private firestore: Firestore) {}

  //Canciones
  addSong(song: Song) {
    const songRef = collection(this.firestore, 'songs');
    return addDoc(songRef, song)
      .then((docRef) => {
        console.log('Document written with ID: ', docRef.id);
        return docRef;
      })
      .catch((error) => {
        console.error('Error adding document: ', error);
        return null;
      });
  }

  //Trae todas las canciones para agregarla al dashboard
  getSongs(): Observable<Song[]> {
    const songRef = collection(this.firestore, 'songs');
    return collectionData(songRef, { idField: 'id' }) as Observable<Song[]>;
  }

  // Método para obtener una canción específica por ID para la pagina song
  getSongById(songId: string): Observable<any> {
    const songRef = doc(this.firestore, `songs/${songId}`);
    return docData(songRef, { idField: 'id' });
  }

  deleteSong(song: Song) {
    const songDocRef = doc(this.firestore, `songs/${song.id}`);
    return deleteDoc(songDocRef);
  }
  // Actualiza una canción
  updateSong(songId: string, songData: Partial<Song>) {
    const songDocRef = doc(this.firestore, `songs/${songId}`);
    return updateDoc(songDocRef, songData);
  }

  //Listas
  addList(list: List) {
    const listRef = collection(this.firestore, 'lists');
    return addDoc(listRef, list)
      .then((docRef) => {
        console.log('Document written with ID: ', docRef.id);
        return docRef;
      })
      .catch((error) => {
        console.error('Error adding document: ', error);
        return null;
      });
  }

  //Trae todas las canciones para agregarla al dashboard
  getLists(): Observable<List[]> {
    const listRef = collection(this.firestore, 'lists');
    return collectionData(listRef, { idField: 'id' }) as Observable<List[]>;
  }

  // Método para obtener una canción específica por ID para la pagina song
  getListById(listId: string): Observable<List> {
    const listRef = doc(this.firestore, `lists/${listId}`);
    return docData(listRef, { idField: 'id' }) as Observable<List>;
  }

  deleteList(list: List) {
    const listDocRef = doc(this.firestore, `lists/${list.id}`);
    return deleteDoc(listDocRef);
  }
  // Actualiza una Lista
  updateList(listId: string, listData: Partial<List>) {
    const listDocRef = doc(this.firestore, `lists/${listId}`);
    return updateDoc(listDocRef, listData);
  }
  //Actualizacion de lista con ids de songs
  updateSongsInList(listId: string, songIds: string[]): Promise<void> {
    const listDocRef = doc(this.firestore, `lists/${listId}`);
    return updateDoc(listDocRef, { songIds });
  }
}
