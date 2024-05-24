import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  formLogin: FormGroup;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastController: ToastController
  ) {
    this.formLogin = new FormGroup({
      email: new FormControl(),
      password: new FormControl(),
    });
  }

  ngOnInit() {}
  //Toast
  async presentToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'bottom',
    });
    toast.present();
  }
  onSubmit() {
    this.authService
      .login(this.formLogin.value)
      .then((response) => {
        console.log(response);
        this.router.navigate(['admin/dashboard']);
        this.presentToast('Ha iniciado sesión correctamente'); // Mostrar toast de éxito
      })
      .catch((error) => {
        console.log(error);
        this.presentToast('Ingrese credenciales correctamente'); // Mostrar toast de error
      });
  }
}
