import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Storage, ref, uploadBytesResumable, getDownloadURL } from '@angular/fire/storage';
import { FirestoreService } from 'src/app/services/firestore.service';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { AppUpdateParams } from 'src/app/interfaces/app-update';
import { Application } from 'js-app-parser';

@Component({
  selector: 'app-update-app',
  templateUrl: './update-app.page.html',
  styleUrls: ['./update-app.page.scss'],
})
export class UpdateAppPage implements OnInit {
  updateForm: FormGroup;
  selectedFile: File | null = null;
  uploadProgress: number = 0;
  isUploading: boolean = false;
  isParsing: boolean = false;

  constructor(
    private fb: FormBuilder,
    private storage: Storage,
    private firestoreService: FirestoreService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    this.updateForm = this.fb.group({
      version: ['', Validators.required],
      build_number: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
      mensaje: ['', Validators.required],
      obligatoria: [false],
    });
  }

  ngOnInit() {}

  async onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.name.endsWith('.apk')) {
        this.selectedFile = file;
        await this.parseApk(file);
      } else {
        this.presentToast('Por favor selecciona un archivo .apk válido', 'danger');
        this.selectedFile = null;
        event.target.value = ''; // Reset input
      }
    }
  }

  async parseApk(file: File) {
    this.isParsing = true;
    try {
      const result = await Application.loadAsync(file);
      console.log('APK Info:', result);

      // js-app-parser devuelve un objeto Application con las propiedades directas
      const version = result.versionName;
      const build = result.versionCode;

      if (version && build) {
        this.updateForm.patchValue({
          version: version,
          build_number: build
        });
        this.presentToast(`Versión detectada: ${version} (${build})`, 'success');
      } else {
        this.presentToast('No se pudo extraer la información de la versión del APK', 'warning');
      }
    } catch (error) {
      console.error('Error parsing APK:', error);
      this.presentToast('Error al leer el archivo APK', 'danger');
    } finally {
      this.isParsing = false;
    }
  }

  async onSubmit() {
    if (this.updateForm.invalid || !this.selectedFile) {
      this.updateForm.markAllAsTouched();
      if (!this.selectedFile) this.presentToast('Debes seleccionar un archivo APK', 'warning');
      return;
    }

    const confirm = await this.presentConfirm();
    if (!confirm) return;

    this.isUploading = true;
    this.uploadProgress = 0;

    try {
      // 1. Subir APK a Firebase Storage
      const version = this.updateForm.get('version')?.value;
      const filePath = `apks/${version}/app-release.apk`;
      const storageRef = ref(this.storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, this.selectedFile);

      uploadTask.on('state_changed', 
        (snapshot) => {
          this.uploadProgress = (snapshot.bytesTransferred / snapshot.totalBytes);
        },
        (error) => {
          console.error('Upload error:', error);
          this.isUploading = false;
          this.presentToast('Error al subir el archivo', 'danger');
        },
        async () => {
          // 2. Obtener URL de descarga
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // 3. Actualizar Firestore
          const updateData: AppUpdateParams = {
            version: version,
            build_number: Number(this.updateForm.get('build_number')?.value),
            url_descarga: downloadURL,
            obligatoria: this.updateForm.get('obligatoria')?.value,
            mensaje: this.updateForm.get('mensaje')?.value,
            fecha: new Date()
          };

          await this.firestoreService.updateAppParams(updateData);

          this.isUploading = false;
          this.presentToast('Actualización publicada con éxito', 'success');
          this.resetForm();
        }
      );

    } catch (error) {
      console.error('Error:', error);
      this.isUploading = false;
      this.presentToast('Ocurrió un error inesperado', 'danger');
    }
  }

  resetForm() {
    this.updateForm.reset({ obligatoria: false });
    this.selectedFile = null;
    this.uploadProgress = 0;
  }

  async presentToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom'
    });
    toast.present();
  }

  async presentConfirm(): Promise<boolean> {
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: 'Confirmar Publicación',
        message: `¿Estás seguro de publicar la versión ${this.updateForm.get('version')?.value}? Esto actualizará la app para todos los usuarios.`,
        buttons: [
          {
            text: 'Cancelar',
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: 'Publicar',
            handler: () => resolve(true)
          }
        ]
      });
      await alert.present();
    });
  }
}
