import { Component } from '@angular/core';
import { AuthService } from './services/auth.service';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { Subscription, finalize } from 'rxjs';
import { FirestoreService } from './services/firestore.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  public appPages = [
    { title: 'Canciones', url: '/admin/dashboard', icon: 'newspaper' },
    { title: 'Lista semanal', url: '/admin/list-week', icon: 'newspaper' },
  ];
  userName: string | null = null;
  userCargo: string | null = null;

  private userNameSubscription: Subscription;

  constructor(
    private authService: AuthService,
    private toastController: ToastController,
    private router: Router
  ) {
    (this.userNameSubscription = this.authService.userName$.subscribe(
      (name) => {
        this.userName = name;
      }
    )),
      this.authService.userCargo$.subscribe((cargo) => {
        this.userCargo = cargo;
      });
  }

  //Toast
  async presentToast(message: string, position: 'bottom', color: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: position,
      color: color,
    });

    await toast.present();
  }
  //Cierre de sesion
  logouth() {
    this.authService
      .logout()
      .then(() => {
        this.presentToast('Sesion finalizada correctamente', 'bottom', 'dark');
        this.router.navigate(['auth/login']);
      })
      .catch((error) => console.log(error));
  }

  ngOnDestroy() {
    if (this.userNameSubscription) {
      this.userNameSubscription.unsubscribe();
    }
  }
}
