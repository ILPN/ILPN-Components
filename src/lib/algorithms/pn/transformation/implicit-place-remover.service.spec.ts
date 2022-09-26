import {TestBed} from '@angular/core/testing';
import {ImplicitPlaceRemoverService} from './implicit-place-remover.service';
import {PetriNetParserService} from '../../../models/pn/parser/petri-net-parser.service';
import {createMockTrace} from '../../../utility/test/create-mock-trace';

describe('ImplicitPlaceRemoverService', () => {
    let service: ImplicitPlaceRemoverService;
    let netParser: PetriNetParserService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ImplicitPlaceRemoverService);
        netParser = TestBed.inject(PetriNetParserService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should remove implicit places', () => {
        let net = netParser.parse(`.type pn
.places
s 1
z 0
x 0
a 0
b 0
.transitions
A A
B B
C C
.arcs
s A
A x
A a
a B
B b
x C
b C
C z`)!;

        let noImplicit = service.removeImplicitPlaces(net, [createMockTrace([{n: 'A'}, {n: 'B'}, {n: 'C'}])])

        expect(noImplicit).toBeTruthy();
        expect(noImplicit.getTransitions().length).toBe(3);
        expect(noImplicit.getPlaces().length).toBe(4);
        expect(noImplicit.getArcs().length).toBe(6);
        expect(noImplicit.getPlaces().every(p => p.id !== 'x')).toBeTrue();

        net = netParser.parse(`.type pn
.places
s 1
z 0
x 0
a 0
b 0
c 0
.transitions
A A
B B
C C
D D
.arcs
s A
A x
A a
a B
B b
b C
C c
x D
c D
D z`)!;

        noImplicit = service.removeImplicitPlaces(net, [createMockTrace([{n: 'A'}, {n: 'B'}, {n: 'C'}, {n: 'D'}])])

        expect(noImplicit).toBeTruthy();
        expect(noImplicit.getTransitions().length).toBe(4);
        expect(noImplicit.getPlaces().length).toBe(5);
        expect(noImplicit.getArcs().length).toBe(8);
        expect(noImplicit.getPlaces().every(p => p.id !== 'x')).toBeTrue();
    });

});
