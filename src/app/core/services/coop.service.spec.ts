import { TestBed } from '@angular/core/testing';

import { CoopService } from '../../core/services/coop.service';

describe('CoopService', () => {
  let service: CoopService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CoopService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
