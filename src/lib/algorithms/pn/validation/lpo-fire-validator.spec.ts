import {PetriNetParserService} from "../../../models/pn/io/parser/petri-net-parser.service";
import {PartialOrderParserService} from "../../../models/po/parser/partial-order-parser.service";
import {LpoFireValidator} from "./lpo-fire-validator";
import {PetriNet} from "../../../models/pn/model/petri-net";
import {PartialOrder} from "../../../models/po/model/partial-order";
import {TestBed} from "@angular/core/testing";

describe('LpoFireValidator', () => {
    let netParser: PetriNetParserService;
    let poParser: PartialOrderParserService;

    let net150: PetriNet;
    let run5: PartialOrder;

    beforeEach(() => {
        TestBed.configureTestingModule({});
        netParser = TestBed.inject(PetriNetParserService);
        expect(netParser).toBeTruthy();
        poParser = TestBed.inject(PartialOrderParserService);
        expect(poParser).toBeTruthy();

        // parse test nets/runs
        // TODO deduplicate test files (separate .ts file with string constants?)
        net150 = netParser.parse(`.type pn
.transitions
vote vote
close close
decide decide
.places
p1 150
p2 0
p3 150
p4 0
p5 0
.arcs
p1 vote
vote p2
vote p3
p3 vote
p3 close 150
close p4
p4 decide
decide p5`)!;
        expect(net150).toBeTruthy();

        run5 = poParser.parse(`.type po
.events
v1 vote
v2 vote
v3 vote
v4 vote
v5 vote
c close
d decide
.arcs
v1 c
v2 c
v3 c
v4 c
v5 c
c d`)!;
        expect(run5).toBeTruthy();
    });

    it('should validate run of net with arc weights, multiple initial tokens, and self-loop', () => {
        const validator = new LpoFireValidator(net150, run5);
        expect(validator).toBeTruthy();
        const result = validator.validate();
        expect(result).toBeTruthy();
        expect(result.length).toBe(5);
        expect(result.every(r => r.valid)).toBeTrue();
    });
});
