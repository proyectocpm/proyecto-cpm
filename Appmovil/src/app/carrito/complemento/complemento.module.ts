import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ComplementoPageRoutingModule } from './complemento-routing.module';

import { ComplementoPage } from './complemento.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ComplementoPageRoutingModule
  ],
  declarations: [ComplementoPage]
})
export class ComplementoPageModule {}
