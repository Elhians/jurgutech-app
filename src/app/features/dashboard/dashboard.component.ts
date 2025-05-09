import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import{ CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { CoopService } from '../../core/services/coop.service';
import { Coop } from '../../core/models/coop.model';
import { Router } from '@angular/router';
import { User } from '../../core/models/user.model';
import { MatDialog } from '@angular/material/dialog';
import { QRCodeScannerComponent } from '../qr-code-scanner/qr-code-scanner.component';
import { AccessCodeModalComponent } from '../acces-code-modal/acces-code-modal.component';


@Component({
  selector: 'app-dashboard',
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  coops: Coop[] = [];
  loading = true;
  error: string = '';
  codeInput: string = '';
  showCodeInput: boolean = false;

  constructor(
    private authService: AuthService,
    private coopService: CoopService,
    private router: Router,
    private dialog: MatDialog,
    private location: Location // Inject Location service
  ) {}

  ngOnInit(): void {

    this.authService.user$.subscribe(user => {
      this.user = user ? {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        prenom: user.prenom || '',
        nom: user.nom || '',
        password: user.password || '',
        tel: user.tel || '',
      } : null;
      if (user?.uid) {
        this.coopService.getUserCoops(user.uid).subscribe({
          next: (data) => {
            this.coops = data;
            this.loading = false;
          },
          error: (err) => {
            this.error = err.message;
            this.loading = false;
          }
        });
      }
    });
  }

  goToCoop(id: string) {
    this.router.navigate(['/dashboard/coop/view', id]);
  }

  addCoopWithCode() {
    const dialogRef = this.dialog.open(AccessCodeModalComponent, {
      width: '300px'
    });

    dialogRef.afterClosed().subscribe(code => {
      if (code) {
        this.coopService.linkCoopByCode(code).then(() => {
          // Reload the list
          this.ngOnInit();
        }).catch(err => this.error = err.message);
      }
    });
  }

  addCoopWithQR() {
    const dialogRef = this.dialog.open(QRCodeScannerComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(qrCode => {
      if (qrCode) {
        this.coopService.linkCoopByCode(qrCode).then(() => {
          this.ngOnInit();
        }).catch(err => this.error = err.message);
      }
    });
  }

  submitAccessCode() {
    if (!this.codeInput.trim()) {
      this.error = 'Veuillez entrer un code valide.';
      return;
    }

    this.coopService.linkCoopByCode(this.codeInput)
      .then(() => {
        this.error = '';
        this.codeInput = '';
        this.showCodeInput = false;
        this.loadCoops(); // Refactor to reload only coops
      })
      .catch(err => this.error = err.message);
  }

  goBack() {
    this.location.back(); // Navigate to the previous page
  }

  private loadCoops() {
    const userId = this.user?.uid;
    if (userId) {
      this.coopService.getUserCoops(userId).subscribe({
        next: (data) => this.coops = data,
        error: (err) => this.error = err.message
      });
    }
  }
}