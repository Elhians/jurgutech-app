import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-video-modal',
  template: `
    <div class="video-modal">
      <video [src]="data.streamUrl" autoplay muted controls></video>
    </div>
  `,
  styles: [`
    .video-modal {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
    }

    video {
      width: 100%;
      height: 100%;
      border-radius: 8px;
    }
  `]
})
export class VideoModalComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { streamUrl: string }) {}
}
