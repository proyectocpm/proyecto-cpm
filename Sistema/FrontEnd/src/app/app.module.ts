import { BrowserModule } from '@angular/platform-browser';
import { LOCALE_ID, NgModule } from '@angular/core';
import {MatTableModule} from '@angular/material/table'; 
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MatCheckboxModule} from '@angular/material/checkbox';

import {MatPaginatorModule} from '@angular/material/paginator';
import {MatSortModule} from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatButtonModule} from '@angular/material/button';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './componentes/home/home.component';
import { NavbarComponent } from './componentes/navbar/navbar.component';
import { RegistroComponent } from './componentes/usuario/registro/registro.component';
import { PerfilComponent } from './componentes/usuario/perfil/perfil.component';
import { Page404Component } from './componentes/page404/page404.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';

import { DataApiService } from './services/data-api.service'; 
import { HttpClientModule } from '@angular/common/http';
import { AuthGuard } from './guards/auth.guard';
import { RolGuard } from './guards/rol.guard';
import { ProductoComponent } from './componentes/producto/producto.component';
import { ModalComponent } from './componentes/modal/modal.component';

import { NgxSpinnerModule } from 'ngx-spinner';
import { NgxPaginationModule } from 'ngx-pagination';
import { PedidoComponent } from './componentes/pedido/pedido.component';
import { FacturaComponent } from './componentes/factura/factura.component';
import { BusquedaFacturaPipe } from './filtros/busqueda-factura.pipe';
import { BusquedaProductoPipe } from './filtros/busqueda-producto.pipe';
// idioma
import localeEs from '@angular/common/locales/es';
import { registerLocaleData } from '@angular/common';
registerLocaleData(localeEs, 'es');
@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    NavbarComponent,
    RegistroComponent,
    PerfilComponent,
    Page404Component,
    ProductoComponent,
    ModalComponent,
    PedidoComponent,
    FacturaComponent,
    BusquedaFacturaPipe,
    BusquedaProductoPipe,
  ],
  imports: [
    HttpClientModule, FormsModule,
    BrowserModule,
    AppRoutingModule, NgxSpinnerModule, NgxPaginationModule, MatTableModule, BrowserAnimationsModule, FontAwesomeModule
    , MatCheckboxModule, MatPaginatorModule, MatSortModule, MatFormFieldModule, MatIconModule, MatInputModule, MatButtonModule
  ],
  providers: [{provide: LOCALE_ID, useValue: 'es'}, DataApiService, AuthGuard, RolGuard],
  bootstrap: [AppComponent]
})
export class AppModule { }
