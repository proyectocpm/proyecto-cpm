import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ComplementoPage } from './complemento.page';

/*const routes: Routes = [
  {
    path: '',
    component: ComplementoPage
  }
];*/

@NgModule({
 // imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ComplementoPageRoutingModule {}
