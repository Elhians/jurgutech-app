import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { VideoModalComponent } from '../video-modal/video-modal.component';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [
    CommonModule,
    DashboardRoutingModule,
    ZXingScannerModule,
    MatDialogModule,
    FormsModule,
    VideoModalComponent
  ]
})
export class DashboardModule { }
