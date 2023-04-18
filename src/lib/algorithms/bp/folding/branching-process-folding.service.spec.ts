import {TestBed} from '@angular/core/testing';
import {BranchingProcessFoldingService} from './branching-process-folding.service';
import {PetriNetParserService} from '../../../models/pn/parser/petri-net-parser.service';
import {PetriNetIsomorphismService} from '../../pn/isomorphism/petri-net-isomorphism.service';
import {LogSymbol} from '../../log/log-symbol';


describe('BranchingProcessFoldingService', () => {
    let service: BranchingProcessFoldingService;
    let parser: PetriNetParserService;
    let isomorphism: PetriNetIsomorphismService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(BranchingProcessFoldingService);
        parser = TestBed.inject(PetriNetParserService);
        isomorphism = TestBed.inject(PetriNetIsomorphismService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('call with one net should return itself', () => {
        expect(service).toBeTruthy();
        const net = parser.parse(`.type pn
.transitions
a A
b B
.places
0 0
1 0
2 0
.arcs
0 a
a 1
1 b
b 2
`)!;
        expect(net).toBeTruthy();

        const folded = service.foldPartialOrders([net]);
        expect(folded).toBeTruthy();

        const result = parser.parse(`.type pn
.transitions
start ${LogSymbol.START}
a A
b B
.places
s 0
0 0
1 0
2 0
.arcs
s start
start 0
0 a
a 1
1 b
b 2
`)!;
        expect(result).toBeTruthy();

        expect(isomorphism.arePetriNetsIsomorphic(folded, result)).toBeTrue();
    });

    it('call with same nets should return the net', () => {
        expect(service).toBeTruthy();
        const net = `.type pn
.transitions
a A
b B
.places
0 0
1 0
2 0
.arcs
0 a
a 1
1 b
b 2
`;
        const net1 = parser.parse(net)!;
        expect(net1).toBeTruthy();
        const net2 = parser.parse(net)!;
        expect(net2).toBeTruthy();

        const folded = service.foldPartialOrders([net1, net2]);
        expect(folded).toBeTruthy();

        const result = parser.parse(`.type pn
.transitions
start ${LogSymbol.START}
a A
b B
.places
s 0
0 0
1 0
2 0
.arcs
s start
start 0
0 a
a 1
1 b
b 2
`)!;
        expect(result).toBeTruthy();

        expect(isomorphism.arePetriNetsIsomorphic(folded, result)).toBeTrue();
    });

    it('call with prefix should return the complete net', () => {
        expect(service).toBeTruthy();
        const net = parser.parse(`.type pn
.transitions
a A
b B
.places
0 0
1 0
2 0
.arcs
0 a
a 1
1 b
b 2
`)!;
        expect(net).toBeTruthy();
        const prefix = parser.parse(`.type pn
.transitions
a A
.places
0 0
1 0
.arcs
0 a
a 1
`)!;
        expect(prefix).toBeTruthy();

        const folded = service.foldPartialOrders([net, prefix]);
        expect(folded).toBeTruthy();

        const result = parser.parse(`.type pn
.transitions
start ${LogSymbol.START}
a A
b B
.places
s 0
0 0
1 0
2 0
.arcs
s start
start 0
0 a
a 1
1 b
b 2
`)!;
        expect(result).toBeTruthy();

        expect(isomorphism.arePetriNetsIsomorphic(folded, result)).toBeTrue();
    });

    it('call with conflict should create conflict', () => {
        expect(service).toBeTruthy();
        const netB = parser.parse(`.type pn
.transitions
a A
b B
.places
0 0
1 0
2 0
.arcs
0 a
a 1
1 b
b 2
`)!;
        expect(netB).toBeTruthy();
        const netC = parser.parse(`.type pn
.transitions
a A
c C
.places
0 0
1 0
2 0
.arcs
0 a
a 1
1 c
c 2
`)!;
        expect(netC).toBeTruthy();

        const folded = service.foldPartialOrders([netB, netC]);
        expect(folded).toBeTruthy();

        const result = parser.parse(`.type pn
.transitions
start ${LogSymbol.START}
a1 A
a2 A
b B
c C
.places
s 0
0 0
1 0
2 0
3 0
4 0
.arcs
s start
start 0
0 a1
a1 1
1 c
c 2
0 a2
a2 3
3 b
b 4
`)!;
        expect(result).toBeTruthy();

        expect(isomorphism.arePetriNetsIsomorphic(folded, result)).toBeTrue();
    });

    it('net with multiple input places should fold', () => {
        expect(service).toBeTruthy();
        const net = parser.parse(`.type pn
.transitions
a A
.places
0 0
1 0
.arcs
0 a
a 1
`)!;
        expect(net).toBeTruthy();
        const prefix = parser.parse(`.type pn
.transitions
b B
c C
.places
0 0
1 0
2 0
3 0
.arcs
0 b
b 1
2 c
c 3
`)!;
        expect(prefix).toBeTruthy();

        const folded = service.foldPartialOrders([net, prefix]);
        expect(folded).toBeTruthy();

        const result = parser.parse(`.type pn
.transitions
start1 ${LogSymbol.START}
start2 ${LogSymbol.START}
a A
b B
c C
.places
s 0
0 0
1 0
2 0
3 0
4 0
5 0
.arcs
s start1
start1 0
s start2
start2 2
start2 3
0 a
a 1
2 b
b 4
3 c
c 5
`)!;
        expect(result).toBeTruthy();

        expect(isomorphism.arePetriNetsIsomorphic(folded, result)).toBeTrue();
    });

    it('prefix with synchronisation, should be paired correctly', () => {
        expect(service).toBeTruthy();
        const netX = parser.parse(`.type pn
.transitions
a A
b B
c C
d D
e E
x X
.places
0 0
1 0
2 0
3 0
4 0
5 0
6 0
7 0
.arcs
0 a
a 1
a 2
1 b
b 3
2 c
c 4
3 d
4 d
d 5
5 e
e 6
6 x
x 7
`)!;
        expect(netX).toBeTruthy();
        const netY = parser.parse(`.type pn
.transitions
a A
b B
c C
d D
e E
y Y
.places
0 0
1 0
2 0
3 0
4 0
5 0
6 0
7 0
.arcs
0 a
a 1
a 2
1 b
b 3
2 c
c 4
3 d
4 d
d 5
5 e
e 6
6 y
y 7
`)!;
        expect(netY).toBeTruthy();

        const folded = service.foldPartialOrders([netX, netY]);
        expect(folded).toBeTruthy();

        const result = parser.parse(`.type pn
.transitions
start ${LogSymbol.START}
a A
b B
c C
d D
e1 E
e2 E
x X
y Y
.places
s 0
0 0
1 0
2 0
3 0
4 0
5 0
6 0
7 0
8 0
9 0
.arcs
s start
start 0
0 a
a 1
a 2
1 b
b 3
2 c
c 4
3 d
4 d
d 5
5 e1
e1 6
6 x
x 7
5 e2
e2 8
8 y
y 9
`)!;
        expect(result).toBeTruthy();

        expect(isomorphism.arePetriNetsIsomorphic(folded, result)).toBeTrue();
    });

    it('prefix with synchronisation, should conflict correctly', () => {
        expect(service).toBeTruthy();
        const netE = parser.parse(`.type pn
.transitions
a A
b B
c C
d D
e E
.places
0 0
1 0
2 0
3 0
4 0
5 0
6 0
.arcs
0 a
a 1
a 2
1 b
b 3
2 c
c 4
3 d
4 d
d 5
5 e
e 6
`)!;
        expect(netE).toBeTruthy();
        const netF = parser.parse(`.type pn
.transitions
a A
b B
c C
d D
f F
.places
0 0
1 0
2 0
3 0
4 0
5 0
6 0
.arcs
0 a
a 1
a 2
1 b
b 3
2 c
c 4
3 d
4 d
d 5
5 f
f 6
`)!;
        expect(netF).toBeTruthy();

        const folded = service.foldPartialOrders([netE, netF]);
        expect(folded).toBeTruthy();

        const result = parser.parse(`.type pn
.transitions
start ${LogSymbol.START}
a A
b B
c C
d1 D
d2 D
e E
f F
.places
s 0
0 0
1 0
2 0
3 0
4 0
5 0
6 0
7 0
8 0
.arcs
s start
start 0
0 a
a 1
a 2
1 b
b 3
2 c
c 4
3 d1
4 d1
3 d2
4 d2
d1 5
5 e
e 6
d2 7
7 f
f 8
`)!;
        expect(result).toBeTruthy();

        expect(isomorphism.arePetriNetsIsomorphic(folded, result)).toBeTrue();
    });

    // TODO the isomorphism is even worse than I thought....
    xit(`two conflicting parallel branches should fold correctly`, () => {
        expect(service).toBeTruthy();
        const once = parser.parse(`.type pn
.transitions
a A
b B
c C
d D
.places
0 0
1 0
2 0
3 0
4 0
5 0
.arcs
0 a
a 1
a 2
1 b
2 c
b 3
c 4
3 d
4 d
d 5
`)!;
        expect(once).toBeTruthy();
        const twice = parser.parse(`.type pn
.transitions
a A
b1 B
b2 B
c C
d D
x X
.places
0 0
1 0
2 0
3 0
4 0
5 0
6 0
7 0
.arcs
0 a
a 1
a 2
1 b1
2 c
b1 3
c 4
4 d
d 5
3 x
x 6
6 b2
b2 7
7 d
`)!;
        expect(twice).toBeTruthy();

        const folded = service.foldPartialOrders([once, twice]);
        expect(folded).toBeTruthy();

        const result = parser.parse(`.type pn
.transitions
start ${LogSymbol.START}
a A
b1 B
b2 B
b3 B
c C
d1 D
d2 D
x X
.places
s 0
0 0
1 0
2 0
3 0
4 0
5 0
6 0
7 0
8 0
9 0
.arcs
s start
start 0
0 a
a 1
a 2
1 b1
1 b2
2 c
b1 3
b2 4
c 5
3 x
4 d1
5 d1
x 6
d1 7
6 b3
b3 8
8 d2
5 d2
d2 9
`)!;
        expect(result).toBeTruthy();

        expect(isomorphism.arePetriNetsIsomorphic(folded, result)).toBeTrue();
    });

    // TODO a by-hand comparison of the two results shows, that the algorithm works correctly. The existing isomorphism implementation is so inefficient, that the comparison of the actual with the expected result does not complete in time and the test is aborted
    xit(`simplified 'repair example' should fold correctly`, () => {
        expect(service).toBeTruthy();
        const simple = parser.parse(`.type pn
.transitions
a Analyze
s Simple
i Inform
r Archive
.places
0 0
1 0
2 0
3 0
4 0
5 0
.arcs
0 a
a 1
a 2
1 s
s 3
2 i
i 4
3 r
4 r
r 5
`)!;
        expect(simple).toBeTruthy();
        const complex = parser.parse(`.type pn
.transitions
a Analyze
c Complex
i Inform
r Archive
.places
0 0
1 0
2 0
3 0
4 0
5 0
.arcs
0 a
a 1
a 2
1 c
c 3
2 i
i 4
3 r
4 r
r 5
`)!;
        expect(complex).toBeTruthy();
        const simpleRepeat = parser.parse(`.type pn
.transitions
a Analyze
s1 Simple
s2 Simple
i Inform
r Archive
x Restart
.places
0 0
1 0
2 0
3 0
4 0
5 0
6 0
7 0
.arcs
0 a
a 1
a 2
1 s1
s1 3
3 x
x 6
6 s2
s2 7
2 i
i 4
7 r
4 r
r 5
`)!;
        expect(simpleRepeat).toBeTruthy();
        const simpleRepeatTwice = parser.parse(`.type pn
.transitions
a Analyze
s1 Simple
s2 Simple
s3 Simple
i Inform
r Archive
x1 Restart
x2 Restart
.places
0 0
1 0
2 0
3 0
4 0
5 0
6 0
7 0
8 0
9 0
.arcs
0 a
a 1
a 2
1 s1
s1 3
3 x1
x1 6
6 s2
s2 8
8 x2
x2 9
9 s3
s3 7
2 i
i 4
7 r
4 r
r 5
`)!;
        expect(simpleRepeatTwice).toBeTruthy();

        const folded = service.foldPartialOrders([simple, complex, simpleRepeat, simpleRepeatTwice]);
        expect(folded).toBeTruthy();

        const result = parser.parse(`.type pn
.transitions
start ${LogSymbol.START}
a1 Analyze
a2 Analyze
s1 Simple
s2 Simple
s3 Simple
s4 Simple
s5 Simple
c Complex
i1 Inform
i2 Inform
r1 Archive
r2 Archive
r3 Archive
r4 Archive
x1 Restart
x2 Restart
.places
s 0
0 0
1 0
2 0
3 0
4 0
5 0
6 0
7 0
8 0
9 0
10 0
11 0
12 0
13 0
14 0
15 0
16 0
17 0
18 0
.arcs
s start
start 0
0 a1
0 a2
a1 1
a1 2
a2 3
a2 4
1 s1
1 s2
2 i1
3 c
4 i2
s1 5
s2 6
i1 7
c 8
i2 9
5 x1
6 r1
7 r1
7 r3
7 r4
8 r2
9 r2
x1 10
r1 11
r2 12
10 s3
10 s4
s3 13
s4 14
13 r3
14 x2
x2 15
r3 16
15 s5
s5 17
17 r4
r4 18
`)!;
        expect(result).toBeTruthy();

        expect(isomorphism.arePetriNetsIsomorphic(folded, result)).toBeTrue();
    });
});
