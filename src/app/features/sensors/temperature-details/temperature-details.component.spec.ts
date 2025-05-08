import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemperatureDetailsComponent } from './temperature-details.component';

describe('TemperatureDetailsComponent', () => {
  let component: TemperatureDetailsComponent;
  let fixture: ComponentFixture<TemperatureDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemperatureDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TemperatureDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
