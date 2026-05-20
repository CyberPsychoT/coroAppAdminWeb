import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy {
  public appPages = [
    { title: 'Canciones', url: '/admin/dashboard', icon: 'musical-notes' },
    { title: 'Lista semanal', url: '/admin/list-week', icon: 'calendar' },
  ];

  userName: string | null = null;
  userCargo: string | null = null;
  isDarkMode = false;

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

  ngOnInit() {
    this.initTheme();
  }

  // ── Theme management ──────────────────────────────────────

  /**
   * Inicializa el tema:
   * 1. Revisa si hay preferencia guardada en localStorage
   * 2. Si no, usa la preferencia del sistema operativo
   */
  private initTheme() {
    const savedTheme = localStorage.getItem('app-theme');

    if (savedTheme) {
      this.isDarkMode = savedTheme === 'dark';
    } else {
      // Detección automática del sistema
      this.isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    this.applyTheme(this.isDarkMode);

    // Escuchar cambios del sistema en tiempo real (solo si no hay preferencia guardada)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('app-theme')) {
        this.isDarkMode = e.matches;
        this.applyTheme(this.isDarkMode);
      }
    });
  }

  /** Aplica o quita la clase .dark-theme en el document.body */
  private applyTheme(dark: boolean) {
    if (dark) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
  }

  /** Toggle manual del usuario — persiste en localStorage */
  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('app-theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme(this.isDarkMode);
  }

  // ── Logout ───────────────────────────────────────────────

  logouth() {
    Swal.fire({
      title: '¿Cerrar Sesión?',
      text: '¿Estás seguro que deseas salir?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ff8c00',
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
            const Toast = Swal.mixin({
              toast: true,
              position: 'bottom',
              showConfirmButton: false,
              timer: 2000,
              timerProgressBar: true,
              didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer);
                toast.addEventListener('mouseleave', Swal.resumeTimer);
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
