import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ZXingScannerModule } from '@zxing/ngx-scanner';

@Component({
  selector: 'app-qr-code-scanner',
  imports: [
    ZXingScannerModule
  ],
  templateUrl: './qr-code-scanner.component.html',
  styleUrl: './qr-code-scanner.component.scss'
})
export class QRCodeScannerComponent {
  constructor(private dialogRef: MatDialogRef<QRCodeScannerComponent>) {}

  onCodeResult(result: string) {
    this.dialogRef.close(result.trim());
  }

  cancel() {
    this.dialogRef.close(null);
  }
}