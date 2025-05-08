import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AmmoniaDetailsComponent } from './ammonia-details.component';

describe('AmmoniaDetailsComponent', () => {
  let component: AmmoniaDetailsComponent;
  let fixture: ComponentFixture<AmmoniaDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AmmoniaDetailsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AmmoniaDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
