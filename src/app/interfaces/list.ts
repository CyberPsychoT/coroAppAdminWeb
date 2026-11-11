import { ListSong } from './list-song';

// En list.ts
export interface List {
  id?: string;
  name: string;
  songs: ListSong[];
  sections?: string[]; // Categorías usadas por esta lista, en orden
  createdAt?: Date;
  selected?: boolean;
  status?: boolean;
  loading?: boolean;
}
