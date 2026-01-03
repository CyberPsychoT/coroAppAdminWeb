export interface AppUpdateParams {
  version: string;
  build_number: number;
  url_descarga: string;
  obligatoria: boolean;
  mensaje: string;
  fecha?: Date;
}
