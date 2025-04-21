import { NgModule, Component, OnInit  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { VideoModalComponent } from './coop/video-modal/video-modal.component';
import { MatDialogModule } from '@angular/material/dialog';

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    ZXingScannerModule,
    MatDialogModule,
    VideoModalComponent
  ]
})
export class DashboardModule { }
