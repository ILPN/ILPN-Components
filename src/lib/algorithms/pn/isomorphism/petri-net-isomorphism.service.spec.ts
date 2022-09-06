import {TestBed} from '@angular/core/testing';
import {PetriNetIsomorphismService} from './petri-net-isomorphism.service';
import {expect} from '@angular/flex-layout/_private-utils/testing';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {PetriNetParserService} from '../../../models/pn/parser/petri-net-parser.service';

describe('PetriNetIsomorphismService', () => {
    let isomorphismService: PetriNetIsomorphismService;
    let parserService: PetriNetParserService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        isomorphismService = TestBed.inject(PetriNetIsomorphismService);
        parserService = TestBed.inject(PetriNetParserService);
    });

    it('should be created', () => {
        expect(isomorphismService).toBeTruthy();
    });

    it('empty net isomorphic', () => {
        expect(isomorphismService.arePartialOrderPetriNetsIsomorphic(new PetriNet(), new PetriNet())).toBeTrue();
        expect(isomorphismService.arePetriNetsIsomorphic(new PetriNet(), new PetriNet())).toBeTrue();
    });

    it('A B parallel PO is isomorphic', () => {
        const po1 = parserService.parse(
            `.type pn
.transitions
a A
b B
.places
p1 0
p2 0
p3 0
p4 0
.arcs
p1 a
a p2
p3 b
b p4`
        );
        expect(po1).toBeTruthy();
        const po2 = parserService.parse(
            `.type pn
.transitions
b A
a B
.places
p1 0
p2 0
p3 0
p4 0
.arcs
p1 a
a p2
p3 b
b p4`
        );
        expect(po2).toBeTruthy();
        expect(isomorphismService.arePartialOrderPetriNetsIsomorphic(po1!, po2!)).toBeTrue();
        expect(isomorphismService.arePetriNetsIsomorphic(po1!, po2!)).toBeTrue();
    });

    it('3A sequence PO is isomorphic', () => {
        const po1 = parserService.parse(
            `.type pn
.transitions
a A
b A
c A
.places
p1 0
p2 0
p3 0
p4 0
.arcs
p1 a
a p2
p2 b
b p3
p3 c
c p4`
        );
        expect(po1).toBeTruthy();
        const po2 = parserService.parse(
            `.type pn
.transitions
b A
a A
c A
.places
p1 0
p2 0
p3 0
p4 0
.arcs
p1 a
a p2
p2 b
b p3
p3 c
c p4`
        );
        expect(po2).toBeTruthy();
        expect(isomorphismService.arePartialOrderPetriNetsIsomorphic(po1!, po2!)).toBeTrue();
        expect(isomorphismService.arePetriNetsIsomorphic(po1!, po2!)).toBeTrue();
    });

    it('AB then C is not C then AB PO', () => {
        const po1 = parserService.parse(
            `.type pn
.transitions
a A
b B
c C
.places
p1 0
p2 0
p3 0
p4 0
p5 0
.arcs
p1 a
a p2
p2 c
p3 b
b p4
p4 c
c p5`
        );
        expect(po1).toBeTruthy();
        const po2 = parserService.parse(
            `.type pn
.transitions
a A
b B
c C
.places
p1 0
p2 0
p3 0
p4 0
p5 0
.arcs
p1 c
c p2
c p3
p2 a
a p4
p3 b
b p5`
        );
        expect(po2).toBeTruthy();
        expect(isomorphismService.arePartialOrderPetriNetsIsomorphic(po1!, po2!)).toBeFalse();
        expect(isomorphismService.arePetriNetsIsomorphic(po1!, po2!)).toBeFalse();
    });

    it('A B conflict is isomorphic', () => {
        const po1 = parserService.parse(
            `.type pn
.transitions
a A
b B
.places
p1 0
p2 0
.arcs
p1 a
a p2
p1 b
b p2`
        );
        expect(po1).toBeTruthy();
        const po2 = parserService.parse(
            `.type pn
.transitions
a A
b B
.places
p1 0
p2 0
.arcs
p1 a
a p2
p1 b
b p2`
        );
        expect(po2).toBeTruthy();
        expect(isomorphismService.arePetriNetsIsomorphic(po1!, po2!)).toBeTrue();
    });

    it('unlabeled loop is isomorphic', () => {
        const po1 = parserService.parse(
            `.type pn
.transitions
a
b
.places
p1 0
p2 0
.arcs
p1 a
a p2
p2 b
b p1`
        );
        expect(po1).toBeTruthy();
        const po2 = parserService.parse(
            `.type pn
.transitions
b
a
.places
p1 0
p2 0
.arcs
p1 a
a p2
p2 b
b p1`
        );
        expect(po2).toBeTruthy();
        expect(isomorphismService.arePetriNetsIsomorphic(po1!, po2!)).toBeTrue();
    });
});
