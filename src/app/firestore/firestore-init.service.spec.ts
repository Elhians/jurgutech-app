import { TestBed } from '@angular/core/testing';

import { FirestoreInitService } from './firestore-init.service';

describe('FirestoreInitService', () => {
  let service: FirestoreInitService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FirestoreInitService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
