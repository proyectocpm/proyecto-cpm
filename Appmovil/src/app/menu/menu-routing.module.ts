import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MenuPage } from './menu.page';

const routes: Routes = [
  {
    path: 'menu',
    component: MenuPage,
    children: [
      {
        path: 'mapa',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../mapa/mapa.module').then(m => m.MapaPageModule)
          }
        ]
      },
      {
        path: 'categoria',
        children: [
          {
            path: '',
            children: [
              {
                path: '',
                loadChildren: () =>
                import('../categoria/categoria.module').then(m => m.CategoriaPageModule)
              },
              {
                path: ':id',
                loadChildren: () => import('../producto/producto.module').then( m => m.ProductoPageModule)
              }
            ]
          }
        ]
      },
      {
        path: 'carrito',
        children: [
          {
            path: '',
            loadChildren: () =>
              import('../carrito/carrito.module').then(m => m.CarritoPageModule)
          }
        ]
      },
      {
        path: 'perfil',
        children: [
          {
            path: '',
            loadChildren: () => import('../perfil/perfil.module').then( m => m.PerfilPageModule)
          }
        ]
      },
      {
        path: '',
        redirectTo: '/menu/mapa',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: '/menu/mapa',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MenuPageRoutingModule {}
