import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-video-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="video-modal">
      <div class="video-container">
        <h3 class="camera-title">{{ data.location }}</h3>
        <video [src]="data.streamUrl" autoplay muted controls></video>
      </div>
    </div>
  `,
  styles: [`
    .video-modal {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.8);
    }

    .video-container {
      background: white;
      padding: 1rem;
      border-radius: 12px;
      max-width: 90vw;
      max-height: 90vh;
    }

    .camera-title {
      margin: 0 0 1rem 0;
      color: #333;
      font-size: 1.2rem;
      text-align: center;
    }

    video {
      width: 100%;
      max-height: 80vh;
      border-radius: 8px;
      background: #000;
    }
  `]
})
export class VideoModalComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { streamUrl: string; location: string }) {}
}
