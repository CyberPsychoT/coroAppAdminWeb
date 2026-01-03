import { Component, OnDestroy } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnDestroy {
  public appPages = [
    { title: 'Canciones', url: '/admin/dashboard', icon: 'musical-notes' },
    { title: 'Lista semanal', url: '/admin/list-week', icon: 'calendar' },
  ];
  userName: string | null = null;
  userCargo: string | null = null;

  private userNameSubscription: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.userNameSubscription = this.authService.userName$.subscribe(
      (name) => {
        this.userName = name;
      }
    );
    
    this.authService.userCargo$.subscribe((cargo) => {
      this.userCargo = cargo;
    });
  }

  // Cierre de sesión con SweetAlert2
  logouth() {
    Swal.fire({
      title: '¿Cerrar Sesión?',
      text: "¿Estás seguro que deseas salir?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff8c00', // Primary Orange
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
      heightAuto: false,
      customClass: {
        popup: 'custom-swal-popup'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.authService.logout()
          .then(() => {
            // Optional: Show goodbye message
            const Toast = Swal.mixin({
              toast: true,
              position: 'bottom',
              showConfirmButton: false,
              timer: 2000,
              timerProgressBar: true,
              didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
              }
            });

            Toast.fire({
              icon: 'success',
              title: 'Sesión finalizada correctamente'
            });

            this.router.navigate(['auth/login']);
          })
          .catch((error) => console.log(error));
      }
    });
  }

  ngOnDestroy() {
    if (this.userNameSubscription) {
      this.userNameSubscription.unsubscribe();
    }
  }
}
