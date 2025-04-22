import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ListComponent } from './coop/list/list.component';
import { ViewComponent } from './coop/view/view.component';
import { DashboardComponent } from './dashboard.component';
import { TemperatureDetailsComponent } from './coop/sensors/temperature-details/temperature-details.component';
import { WaterDetailsComponent } from './coop/sensors/water-details/water-details.component';
import { FoodDetailsComponent } from './coop/sensors/food-details/food-details.component';
import { HumidityDetailsComponent } from './coop/sensors/humidity-details/humidity-details.component';
// Add a placeholder for clean-details if it exists
// import { CleanDetailsComponent } from './coop/sensors/clean-details/clean-details.component';

const routes: Routes = [
  { path: '', component: DashboardComponent },
  { path: 'coop/list', component: ListComponent },
  { path: 'coop/view/:id', component: ViewComponent },
  { path: 'coop/sensors/temperature-details', component: TemperatureDetailsComponent },
  { path: 'coop/sensors/water-details', component: WaterDetailsComponent },
  { path: 'coop/sensors/food-details', component: FoodDetailsComponent },
  { path: 'coop/sensors/humidity-details', component: HumidityDetailsComponent },
  // Uncomment the following line if CleanDetailsComponent exists
  // { path: 'coop/sensors/clean-details', component: CleanDetailsComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DashboardRoutingModule {}
// This module defines the routing for the dashboard feature of the application.