import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WaterDetailsComponent } from './water-details.component';

describe('WaterDetailsComponent', () => {
  let component: WaterDetailsComponent;
  let fixture: ComponentFixture<WaterDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WaterDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(WaterDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
