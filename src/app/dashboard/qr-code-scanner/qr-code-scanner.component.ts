import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ZXingScannerModule } from '@zxing/ngx-scanner';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-qr-code-scanner',
  imports: [
    ZXingScannerModule,
    CommonModule,
    FormsModule
  ],
  templateUrl: './qr-code-scanner.component.html',
  styleUrl: './qr-code-scanner.component.scss'
})
export class QRCodeScannerComponent {
  scanSuccess: boolean = false;
  scanError: boolean = false;

  constructor(private dialogRef: MatDialogRef<QRCodeScannerComponent>) {}

  onCodeResult(result: string): void {
    this.scanSuccess = true;
    this.scanError = false;
    console.log('QR Code detected:', result);
    this.dialogRef.close(result.trim());
  }

  onScanError(): void {
    this.scanSuccess = false;
    this.scanError = true;
    console.error('QR Code detection failed.');
  }

  cancel(): void {
    this.scanSuccess = false;
    this.scanError = false;
    this.dialogRef.close(null);
  }
}