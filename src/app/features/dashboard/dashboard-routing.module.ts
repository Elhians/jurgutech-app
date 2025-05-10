import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListComponent } from './coop/list/list.component';
import { ViewComponent } from './coop/view/view.component';
import { DashboardComponent } from './dashboard.component';
import { TemperatureDetailsComponent } from '../sensors/temperature-details/temperature-details.component';
import { WaterDetailsComponent } from '../sensors/water-details/water-details.component';
import { FoodDetailsComponent } from '../sensors/food-details/food-details.component';
import { HumidityDetailsComponent } from '../sensors/humidity-details/humidity-details.component';
import { AmmoniaDetailsComponent } from '../sensors/ammonia-details/ammonia-details.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'coop/list', component: ListComponent },
  { path: 'coop/view/:id', component: ViewComponent },
  { path: 'coop/sensors/temperature-details', component: TemperatureDetailsComponent },
  { path: 'coop/sensors/water-details', component: WaterDetailsComponent },
  { path: 'coop/sensors/food-details', component: FoodDetailsComponent },
  { path: 'coop/sensors/humidity-details', component: HumidityDetailsComponent },
  { path: 'coop/sensors/ammonia-details', component: AmmoniaDetailsComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule {}
// This module defines the routing for the dashboard feature of the application.