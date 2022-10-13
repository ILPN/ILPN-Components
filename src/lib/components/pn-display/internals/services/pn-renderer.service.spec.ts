import {TestBed} from '@angular/core/testing';
import {PnRendererService} from './pn-renderer.service';

describe('PnRendererService', () => {
    let service: PnRendererService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PnRendererService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
