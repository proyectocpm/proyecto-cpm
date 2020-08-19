import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthserviceService } from '../servicios/authservice.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthserviceService, private router: Router) {}
  canActivate() {
      const user = this.authService.getCurrentCliente();
      if (user) {
      return true;
       } else {
        this.router.navigate(['/login']);
        return false;
      }
  }

}
