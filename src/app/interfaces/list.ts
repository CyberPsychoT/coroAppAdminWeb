import { ListSong } from './list-song';

// En list.ts
export interface List {
  id?: string;
  name: string;
  description?: string;
  songs: ListSong[];
  createdAt?: Date;
  selected?: boolean;
}
