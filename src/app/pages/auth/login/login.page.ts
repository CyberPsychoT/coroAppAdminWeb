import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  formLogin: FormGroup;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.formLogin = new FormGroup({
      email: new FormControl(),
      password: new FormControl(),
    });
  }

  ngOnInit() {}

  onSubmit() {
    this.authService
      .login(this.formLogin.value)
      .then((response) => {
        console.log(response);
        
        // Success Alert
        Swal.fire({
          icon: 'success',
          title: '¡Bienvenido!',
          text: 'Has iniciado sesión correctamente.',
          timer: 2000,
          showConfirmButton: false,
          heightAuto: false, // Important for Ionic
          customClass: {
            popup: 'custom-swal-popup'
          }
        }).then(() => {
          this.router.navigate(['admin/dashboard']);
        });

      })
      .catch((error) => {
        console.log(error);
        
        // Error Alert
        Swal.fire({
          icon: 'error',
          title: 'Error de Acceso',
          text: 'Credenciales incorrectas. Por favor verifica tu correo y contraseña.',
          confirmButtonText: 'Intentar de nuevo',
          heightAuto: false, // Important for Ionic
          customClass: {
            popup: 'custom-swal-popup'
          }
        });
      });
  }
}
