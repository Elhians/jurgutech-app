import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListComponent } from './coop/list/list.component';
import { ViewComponent } from './coop/view/view.component';
import { DashboardComponent } from './dashboard.component';

const routes: Routes = [
  {path:'', component: DashboardComponent},
  { path: 'coop/list', component: ListComponent },
  { path: 'coop/view/:id', component: ViewComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule {}
// This module defines the routing for the dashboard feature of the application.