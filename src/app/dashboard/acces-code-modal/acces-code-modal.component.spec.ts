import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccesCodeModalComponent } from './acces-code-modal.component';

describe('AccesCodeModalComponent', () => {
  let component: AccesCodeModalComponent;
  let fixture: ComponentFixture<AccesCodeModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccesCodeModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccesCodeModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
