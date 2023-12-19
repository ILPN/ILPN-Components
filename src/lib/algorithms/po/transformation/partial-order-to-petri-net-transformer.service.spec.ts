import { TestBed } from '@angular/core/testing';

import { PartialOrderToPetriNetTransformerService } from './partial-order-to-petri-net-transformer.service';

describe('PartialOrderToPetriNetTransformerService', () => {
  let service: PartialOrderToPetriNetTransformerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PartialOrderToPetriNetTransformerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
