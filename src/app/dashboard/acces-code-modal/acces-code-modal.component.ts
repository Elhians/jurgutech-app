import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Location } from '@angular/common';

@Component({
  selector: 'app-acces-code-modal',
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './acces-code-modal.component.html',
  styleUrl: './acces-code-modal.component.scss'
})
export class AccessCodeModalComponent {
  code = '';

  constructor(
    private dialogRef: MatDialogRef<AccessCodeModalComponent>,
    private location: Location // Inject Location service
  ) {}

  submit() {
    this.dialogRef.close(this.code.trim());
  }

  cancel() {
    this.dialogRef.close(null);
  }

  goBack() {
    this.location.back(); // Navigate to the previous page
  }
}

