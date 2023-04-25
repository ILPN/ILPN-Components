import {Node} from "./node";
import {Arc} from "./arc";

describe('Node', () => {
    it('should create', () => {
        const n = new Node();
        expect(n).toBeTruthy();
        expect(n.ingoingArcs).toBeTruthy();
        expect(n.ingoingArcs.length).toBe(0);
        expect(n.ingoingArcWeights).toBeTruthy();
        expect(n.ingoingArcWeights.size).toBe(0);
        expect(n.outgoingArcs).toBeTruthy();
        expect(n.outgoingArcs.length).toBe(0)
        expect(n.outgoingArcWeights).toBeTruthy();
        expect(n.outgoingArcWeights.size).toBe(0);
    });

    it('should add arcs correctly', () => {
        const s = new Node('source');
        const d = new Node('dest');
        const a = new Arc('a', s, d, 5);

        s.addOutgoingArc(a);

        expect(s.outgoingArcs).toBeTruthy();
        expect(s.outgoingArcs.length).toBe(1);
        expect(s.outgoingArcs[0]).toBe(a);
        expect(s.outgoingArcWeights).toBeTruthy();
        expect(s.outgoingArcWeights.size).toBe(1);
        expect(s.outgoingArcWeights.get('dest')).toBe(5);

        d.addIngoingArc(a);

        expect(d.ingoingArcs).toBeTruthy();
        expect(d.ingoingArcs.length).toBe(1);
        expect(d.ingoingArcs[0]).toBe(a);
        expect(d.ingoingArcWeights).toBeTruthy();
        expect(d.ingoingArcWeights.size).toBe(1);
        expect(d.ingoingArcWeights.get('source')).toBe(5);
    });

    it('should remove arcs correctly', () => {
        const s = new Node('source');
        const d = new Node('dest');
        const a = new Arc('a', s, d, 5);

        s.addOutgoingArc(a);
        s.removeArc(a);

        expect(s.outgoingArcs).toBeTruthy();
        expect(s.outgoingArcs.length).toBe(0)
        expect(s.outgoingArcWeights).toBeTruthy();
        expect(s.outgoingArcWeights.size).toBe(0);

        s.addOutgoingArc(a);
        s.removeArc(a.getId());

        expect(s.outgoingArcs).toBeTruthy();
        expect(s.outgoingArcs.length).toBe(0)
        expect(s.outgoingArcWeights).toBeTruthy();
        expect(s.outgoingArcWeights.size).toBe(0);

        d.addIngoingArc(a);
        d.removeArc(a);

        expect(d.ingoingArcs).toBeTruthy();
        expect(d.ingoingArcs.length).toBe(0);
        expect(d.ingoingArcWeights).toBeTruthy();
        expect(d.ingoingArcWeights.size).toBe(0);

        d.addIngoingArc(a);
        d.removeArc(a.getId());

        expect(d.ingoingArcs).toBeTruthy();
        expect(d.ingoingArcs.length).toBe(0);
        expect(d.ingoingArcWeights).toBeTruthy();
        expect(d.ingoingArcWeights.size).toBe(0);
    });
});
