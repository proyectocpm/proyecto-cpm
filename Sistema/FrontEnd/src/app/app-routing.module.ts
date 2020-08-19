import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './componentes/home/home.component';
import { RegistroComponent } from './componentes/usuario/registro/registro.component';
import { PerfilComponent } from './componentes/usuario/perfil/perfil.component';
import { Page404Component } from './componentes/page404/page404.component';
import { ProductoComponent } from './componentes/producto/producto.component';




import { AuthGuard } from './guards/auth.guard';
import { RolGuard } from './guards/rol.guard';
import { NologinGuard } from './guards/nologin.guard';
import { PedidoComponent } from './componentes/pedido/pedido.component';
import { FacturaComponent } from './componentes/factura/factura.component';



const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [NologinGuard] },
  {path: 'usuario/perfil', component: PerfilComponent, canActivate: [AuthGuard] },
  { path: 'usuario/registro', component: RegistroComponent, canActivate: [AuthGuard, RolGuard]},
  {path: 'plato', component: ProductoComponent, canActivate: [AuthGuard, RolGuard]},
  {path: 'pedido', component: PedidoComponent, canActivate: [AuthGuard]},
  {path: 'orden_pedido', component: FacturaComponent, canActivate: [AuthGuard]},

  { path: '**', component: Page404Component }

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
