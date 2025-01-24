import {TestBed} from '@angular/core/testing';
import {ImplicitPlaceRemoverService} from './implicit-place-remover.service';
import {PetriNetParserService} from '../../../models/pn/parser/petri-net-parser.service';

describe('ImplicitPlaceRemoverService', () => {
    let service: ImplicitPlaceRemoverService;
    let netParser: PetriNetParserService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(ImplicitPlaceRemoverService);
        netParser = TestBed.inject(PetriNetParserService);
        expect(netParser).toBeTruthy();
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

        let noImplicit = service.removeImplicitPlaces(net)

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

        noImplicit = service.removeImplicitPlaces(net)

        expect(noImplicit).toBeTruthy();
        expect(noImplicit.getTransitions().length).toBe(4);
        expect(noImplicit.getPlaces().length).toBe(5);
        expect(noImplicit.getArcs().length).toBe(8);
        expect(noImplicit.getPlaces().every(p => p.id !== 'x')).toBeTrue();
    });

    it('should keep non-implicit places', () => {
        let net = netParser.parse(`.type pn
.places
s 1
z 0
x 0
y 0
a 0
b 0
.transitions
A A
B B
C C
X X
Y Y
.arcs
s A
A x
A a
a B
B b
b C
C z
x C
x X
X y
y Y
Y x`)!;

        let noImplicit = service.removeImplicitPlaces(net)

        expect(noImplicit).toBeTruthy();
        expect(noImplicit.getTransitions().length).toBe(5);
        expect(noImplicit.getPlaces().length).toBe(6);
        expect(noImplicit.getArcs().length).toBe(12);

        net = netParser.parse(`.type pn
.places
s 1
z 0
a1 0
a2 0
b1 0
b2 0
c1 0
c2 0
.transitions
A A
B B
C C
S S
Z Z
.arcs
s S
S a1
S b1
S c1
a1 A
A a2
b1 B
B b2
c1 C
C c2
a2 Z
b2 Z
c2 Z
Z z`)!;

        noImplicit = service.removeImplicitPlaces(net)

        expect(noImplicit).toBeTruthy();
        expect(noImplicit.getTransitions().length).toBe(5);
        expect(noImplicit.getPlaces().length).toBe(8);
        expect(noImplicit.getArcs().length).toBe(14);
    });

});
