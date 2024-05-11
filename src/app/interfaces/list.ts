export interface List {
  id?: string;
  name: string;
  description?: string;
  songIds: string[];
  createdAt?: Date;
  selected?: boolean; // Agrega esta línea para manejar la selección de checkbox
}
