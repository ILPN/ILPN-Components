import {TestBed} from '@angular/core/testing';
import {IlpnComponentsService} from './ilpn-components.service';

describe('IlpnComponentsService', () => {
    let service: IlpnComponentsService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(IlpnComponentsService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });
});
