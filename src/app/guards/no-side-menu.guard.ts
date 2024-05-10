import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { MenuController } from '@ionic/angular';

@Injectable({
  providedIn: 'root',
})
export class NoSideMenuGuard implements CanActivate {
  constructor(private menuController: MenuController) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    this.menuController.enable(false);
    return true;
  }
}

@Injectable({
  providedIn: 'root',
})
export class ReactivateMenuGuard implements CanActivate {
  constructor(private menuController: MenuController) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    this.menuController.enable(true);
    return true;
  }
}
