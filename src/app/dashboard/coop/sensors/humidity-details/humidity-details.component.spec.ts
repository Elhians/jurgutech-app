import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HumidityDetailsComponent } from './humidity-details.component';

describe('HumidityDetailsComponent', () => {
  let component: HumidityDetailsComponent;
  let fixture: ComponentFixture<HumidityDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HumidityDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HumidityDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
