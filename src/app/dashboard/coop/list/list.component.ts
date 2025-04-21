import { Component, OnInit } from '@angular/core';
import { CoopService } from '../coop.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-list',
  imports: [
    CommonModule
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss'
})
export class ListComponent implements OnInit {
  coops: { id: string; name: string; accessCode: string; createdAt: any }[] = [];

  constructor(private coopService: CoopService, private router: Router) {}

  ngOnInit(): void {
    const userId = this.getUserId(); // Replace with actual logic to get the user ID
    this.coopService.getUserCoops(userId).subscribe((data) => {
      this.coops = data;
    });
  }

  goToDetails(id: string) {
    this.router.navigate(['/dashboard/coop/view', id]);
  }

  private getUserId(): string {
    // Replace this with the actual logic to retrieve the logged-in user's ID
    return 'exampleUserId';
  }
}
