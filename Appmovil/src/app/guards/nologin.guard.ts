import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthserviceService } from '../servicios/authservice.service';

@Injectable({
  providedIn: 'root'
})
export class NologinGuard implements CanActivate {
  constructor(private authService: AuthserviceService, private router: Router) {}
  canActivate() {
      const user = this.authService.getCurrentCliente();
      if (user) {
        this.router.navigate(['/menu/categoria']);
        return false;
       } else {
        return true; // da paso
      }
  }

}
