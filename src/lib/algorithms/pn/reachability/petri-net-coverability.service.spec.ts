import {TestBed} from '@angular/core/testing';
import {PetriNetCoverabilityService} from './petri-net-coverability.service';
import {PetriNetParserService} from '../../../models/pn/parser/petri-net-parser.service';
import {Marking} from '../../../models/pn/model/marking';

describe('PetriNetCoverabilityService', () => {
    let service: PetriNetCoverabilityService;
    let pnService: PetriNetParserService;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        service = TestBed.inject(PetriNetCoverabilityService);
        pnService = TestBed.inject(PetriNetParserService);
    });

    it('should be created', () => {
        expect(service).toBeTruthy();
    });

    it('should do conflict', () => {
        const net = pnService.parse(`.type pn
.transitions
A A
B B
.places
s 1
a 0
b 0
.arcs
s A
s B
A a
B b`);
        expect(net).toBeTruthy();

        const tree = service.getCoverabilityTree(net!);
        expect(tree).toBeTruthy();
        expect(tree.ancestors.length).toBe(0);
        expect(tree.omegaMarking.equals(new Marking({'s': 1, 'a': 0, 'b': 0}))).toBeTrue();

        let children = tree.getChildrenMap();
        expect(children.size).toBe(2);

        let child = children.get('A')!;
        expect(child).toBeTruthy();
        expect(child.ancestors.length).toBe(1);
        expect(child.ancestors[0]).toBe(tree);
        expect(child.omegaMarking.equals(new Marking({'s': 0, 'a': 1, 'b': 0}))).toBeTrue();
        expect(child.getChildren().length).toBe(0);

        child = children.get('B')!;
        expect(child).toBeTruthy();
        expect(child.ancestors.length).toBe(1);
        expect(child.ancestors[0]).toBe(tree);
        expect(child.omegaMarking.equals(new Marking({'s': 0, 'a': 0, 'b': 1}))).toBeTrue();
        expect(child.getChildren().length).toBe(0);
    });

    it('should do concurrency', () => {
        const net = pnService.parse(`.type pn
.transitions
A A
B B
.places
a1 1
a2 0
b1 1
b2 0
.arcs
a1 A
A a2
b1 B
B b2`);
        expect(net).toBeTruthy();

        const tree = service.getCoverabilityTree(net!);
        expect(tree).toBeTruthy();
        expect(tree.ancestors.length).toBe(0);
        expect(tree.omegaMarking.equals(new Marking({'a1': 1, 'b1': 1, 'a2': 0, 'b2': 0}))).toBeTrue();

        let children = tree.getChildrenMap();
        expect(children.size).toBe(2);

        let child = children.get('A')!;
        expect(child).toBeTruthy();
        expect(child.ancestors.length).toBe(1);
        expect(child.ancestors[0]).toBe(tree);
        expect(child.omegaMarking.equals(new Marking({'a1': 0, 'b1': 1, 'a2': 1, 'b2': 0}))).toBeTrue();
        expect(child.getChildren().length).toBe(1);
        let childChild = child.getChildren()[0];
        expect(childChild).toBeTruthy();
        expect(childChild.ancestors.length).toBe(2);
        expect(childChild.ancestors[0]).toBe(tree);
        expect(childChild.ancestors[1]).toBe(child);
        expect(childChild.omegaMarking.equals(new Marking({'a1': 0, 'b1': 0, 'a2': 1, 'b2': 1}))).toBeTrue();
        expect(childChild.getChildren().length).toBe(0);

        child = children.get('B')!;
        expect(child).toBeTruthy();
        expect(child.ancestors.length).toBe(1);
        expect(child.ancestors[0]).toBe(tree);
        expect(child.omegaMarking.equals(new Marking({'a1': 1, 'b1': 0, 'a2': 0, 'b2': 1}))).toBeTrue();
        expect(child.getChildren().length).toBe(1);
        childChild = child.getChildren()[0];
        expect(childChild).toBeTruthy();
        expect(childChild.ancestors.length).toBe(2);
        expect(childChild.ancestors[0]).toBe(tree);
        expect(childChild.ancestors[1]).toBe(child);
        expect(childChild.omegaMarking.equals(new Marking({'a1': 0, 'b1': 0, 'a2': 1, 'b2': 1}))).toBeTrue();
        expect(childChild.getChildren().length).toBe(0);
    });

    it('should do infinite loops', () => {
        const net = pnService.parse(`.type pn
.transitions
A A
B B
.places
a 1
b 0
.arcs
a A
A b
b B
B a`);
        expect(net).toBeTruthy();

        const tree = service.getCoverabilityTree(net!);
        expect(tree).toBeTruthy();
        expect(tree.ancestors.length).toBe(0);
        expect(tree.omegaMarking.equals(new Marking({'a': 1, 'b': 0}))).toBeTrue();
        expect(tree.getChildren().length).toBe(1);

        let child = tree.getChildren()[0];
        expect(child).toBeTruthy();
        expect(child.ancestors.length).toBe(1);
        expect(child.ancestors[0]).toBe(tree);
        expect(child.omegaMarking.equals(new Marking({'a': 0, 'b': 1}))).toBeTrue();
        expect(child.getChildren().length).toBe(1);

        let childChild = child.getChildren()[0];
        expect(childChild).toBeTruthy();
        expect(childChild.ancestors.length).toBe(2);
        expect(childChild.ancestors[0]).toBe(tree);
        expect(childChild.ancestors[1]).toBe(child);
        expect(childChild.omegaMarking.equals(new Marking({'a': 1, 'b': 0}))).toBeTrue();
        expect(childChild.getChildren().length).toBe(0);
    });

    it('should do omegas', () => {
        const net = pnService.parse(`.type pn
.transitions
A A
B B
.places
a 1
b 0
x 0
.arcs
a A
A b
A x
b B
B a`);
        expect(net).toBeTruthy();

        const tree = service.getCoverabilityTree(net!);
        expect(tree).toBeTruthy();
        expect(tree.ancestors.length).toBe(0);
        expect(tree.omegaMarking.equals(new Marking({'a': 1, 'b': 0, 'x': 0}))).toBeTrue();
        expect(tree.getChildren().length).toBe(1);

        const ancestors = [tree];
        let child = tree.getChildren()[0];
        expect(child).toBeTruthy();
        expect(child.ancestors.length).toBe(1);
        expect(child.ancestors[0]).toBe(ancestors[0]);
        expect(child.omegaMarking.equals(new Marking({'a': 0, 'b': 1, 'x': 1}))).toBeTrue();
        expect(child.getChildren().length).toBe(1);
        ancestors.push(child);

        child = child.getChildren()[0];
        expect(child).toBeTruthy();
        expect(child.ancestors.length).toBe(2);
        expect(child.ancestors[0]).toBe(ancestors[0]);
        expect(child.ancestors[1]).toBe(ancestors[1]);
        expect(child.omegaMarking.equals(new Marking({'a': 1, 'b': 0, 'x': Number.POSITIVE_INFINITY}))).toBeTrue();
        expect(child.getChildren().length).toBe(1);
        ancestors.push(child);

        child = child.getChildren()[0];
        expect(child).toBeTruthy();
        expect(child.ancestors.length).toBe(3);
        expect(child.ancestors[0]).toBe(ancestors[0]);
        expect(child.ancestors[1]).toBe(ancestors[1]);
        expect(child.ancestors[2]).toBe(ancestors[2]);
        expect(child.omegaMarking.equals(new Marking({'a': 0, 'b': 1, 'x': Number.POSITIVE_INFINITY}))).toBeTrue();
        expect(child.getChildren().length).toBe(1);
        ancestors.push(child);

        child = child.getChildren()[0];
        expect(child).toBeTruthy();
        expect(child.ancestors.length).toBe(4);
        expect(child.ancestors[0]).toBe(ancestors[0]);
        expect(child.ancestors[1]).toBe(ancestors[1]);
        expect(child.ancestors[2]).toBe(ancestors[2]);
        expect(child.ancestors[3]).toBe(ancestors[3]);
        expect(child.omegaMarking.equals(new Marking({'a': 1, 'b': 0, 'x': Number.POSITIVE_INFINITY}))).toBeTrue();
        expect(child.getChildren().length).toBe(0);
    });
});
