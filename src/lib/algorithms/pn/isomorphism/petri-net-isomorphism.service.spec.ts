import {TestBed} from '@angular/core/testing';
import {PetriNetIsomorphismService} from './petri-net-isomorphism.service';
import {expect} from '@angular/flex-layout/_private-utils/testing';
import {PetriNet} from '../../../models/pn/model/petri-net';

describe('PetriNetIsomorphismService', () => {
    let isomorphismService: PetriNetIsomorphismService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        isomorphismService = TestBed.inject(PetriNetIsomorphismService);
    });

    it('should be created', () => {
        expect(isomorphismService).toBeTruthy();
    });

    it('empty partial orders are isomorphic', () => {
        expect(isomorphismService.arePartialOrderPetriNetsIsomorphic(new PetriNet(), new PetriNet())).toBeTrue();
    });
});
