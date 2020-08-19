import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CarritoPage } from './carrito.page';
import { ExploreContainerComponentModule } from '../explore-container/explore-container.module';
import { ComplementoPage } from './complemento/complemento.page';
import { ComplementoPageModule } from './complemento/complemento.module';

@NgModule({
  entryComponents: [
    ComplementoPage
  ],
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ExploreContainerComponentModule,
    RouterModule.forChild([{ path: '', component: CarritoPage }]),
    ComplementoPageModule
  ],
  declarations: [CarritoPage]
})
export class CarritoPageModule {}
