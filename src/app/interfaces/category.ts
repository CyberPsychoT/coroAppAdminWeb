export interface Category {
  id?: string;
  name: string;
  order?: number; // Posición en el catálogo (orden de visualización)
  createdAt?: Date;
}
