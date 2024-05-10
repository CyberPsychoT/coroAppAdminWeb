import { Injectable } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  collectionData,
  doc,
  deleteDoc,
  docData,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Song } from '../interfaces/song';
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
  getSongById(songId: string): Observable<Song> {
    const songDocRef = doc(this.firestore, `songs/${songId}`);
    return docData(songDocRef, { idField: 'id' }) as Observable<Song>;
  }

  deleteSong(song: Song) {
    const songDocRef = doc(this.firestore, `songs/${song.id}`);
    return deleteDoc(songDocRef);
  }

  // Método para activar la apertura del componente AddSong
  triggerAddSong(open: boolean) {
    this.openAddSong.next(open);
  }
}
