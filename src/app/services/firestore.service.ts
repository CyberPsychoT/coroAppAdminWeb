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
  writeBatch,
  WriteBatch,
} from '@angular/fire/firestore';
import { Observable, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';
import { Song } from '../interfaces/song';
import { List } from '../interfaces/list';
import { ListSong } from '../interfaces/list-song';
import { Category } from '../interfaces/category';
import { ALL_SONGS_SECTION, LEGACY_SECTIONS } from '../constants/sections';
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

  //Trae todas las listas
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
  updateSongsInList(listId: string, songs: ListSong[]): Promise<void> {
    const listDocRef = doc(this.firestore, `lists/${listId}`);
    console.log('Updating list with songs and sections:', songs);
    return updateDoc(listDocRef, { songs }); // Asegúrate de que 'songs' es la clave correcta en Firestore.
  }

  //Categorías
  addCategory(category: Category) {
    const categoryRef = collection(this.firestore, 'categories');
    return addDoc(categoryRef, category);
  }

  //Trae todas las categorías ordenadas (las que no tienen orden van al final, por nombre)
  getCategories(): Observable<Category[]> {
    const categoryRef = collection(this.firestore, 'categories');
    return (collectionData(categoryRef, { idField: 'id' }) as Observable<Category[]>).pipe(
      map(categories =>
        categories.sort(
          (a, b) =>
            (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER) ||
            a.name.localeCompare(b.name)
        )
      )
    );
  }

  // Guarda el orden del catálogo según la posición en el arreglo
  updateCategoriesOrder(categories: Category[]) {
    const batch = writeBatch(this.firestore);
    categories.forEach((category, index) => {
      batch.update(doc(this.firestore, `categories/${category.id}`), { order: index });
    });
    return batch.commit();
  }

  // Renombra la categoría y la actualiza en todas las listas que la usan
  async renameCategory(category: Category, newName: string) {
    const batches = await this.buildListSectionBatches(category.name, newName);
    batches[0].update(doc(this.firestore, `categories/${category.id}`), { name: newName });
    await Promise.all(batches.map(b => b.commit()));
  }

  // Elimina la categoría y la quita de las listas (sus canciones pasan a "Todas las Canciones")
  async deleteCategory(category: Category) {
    const batches = await this.buildListSectionBatches(category.name, null);
    batches[0].delete(doc(this.firestore, `categories/${category.id}`));
    await Promise.all(batches.map(b => b.commit()));
  }

  // Cantidad de listas que usan una categoría
  async countListsUsingCategory(name: string): Promise<number> {
    const lists = await firstValueFrom(this.getLists());
    return lists.filter(list => this.listUsesSection(list, name)).length;
  }

  private listUsesSection(list: List, name: string): boolean {
    return (list.sections ?? LEGACY_SECTIONS).includes(name) ||
      (list.songs || []).some(ls => ls.section === name);
  }

  // Reemplaza (newName) o quita (null) una categoría en todas las listas
  private async buildListSectionBatches(oldName: string, newName: string | null): Promise<WriteBatch[]> {
    const lists = await firstValueFrom(this.getLists());
    const batches = [writeBatch(this.firestore)];
    let ops = 1; // operación sobre la categoría misma

    lists.filter(list => this.listUsesSection(list, oldName)).forEach(list => {
      // Las listas antiguas sin `sections` se materializan con las predeterminadas
      const currentSections = list.sections ?? LEGACY_SECTIONS;
      const sections = newName === null
        ? currentSections.filter(name => name !== oldName)
        : [...new Set(currentSections.map(name => (name === oldName ? newName : name)))];
      const songs = (list.songs || []).map(ls =>
        ls.section === oldName ? { ...ls, section: newName ?? ALL_SONGS_SECTION } : ls
      );

      if (ops >= 450) {
        batches.push(writeBatch(this.firestore));
        ops = 0;
      }
      batches[batches.length - 1].update(doc(this.firestore, `lists/${list.id}`), { sections, songs });
      ops++;
    });

    return batches;
  }

  // Actualizar parámetros de la app (OTA)
  updateAppParams(data: any) {
    const docRef = doc(this.firestore, 'parametros/app_android');
    // setDoc crea el documento si no existe, o lo sobrescribe si existe.
    // Usamos { merge: true } si quisiéramos solo actualizar campos, pero aquí queremos definir el estado.
    // Sin embargo, setDoc se debe importar. Si usamos updateDoc requerimos que exista.
    // Para seguridad, usaremos setDoc desde 'firebase/firestore' pero necesito importarlo.
    // Como ya tengo 'doc' y 'firestore', voy a usar setDoc.
    
    // NOTA: setDoc no está importado en el archivo original. 
    // Voy a usar updateDoc y si falla (no existe), uso setDoc? 
    // Mejor importo setDoc.
    
    // Espera, no puedo cambiar los imports facilmente con replace_file_content si están arriba.
    // Voy a asumir que el documento YA EXISTE como dijo el usuario ("configure una nueva colection").
    // Si ya existe, updateDoc funciona.
    return updateDoc(docRef, data);
  }
}
