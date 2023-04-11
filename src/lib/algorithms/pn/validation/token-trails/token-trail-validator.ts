import {TokenTrailValidationResult} from '../classes/validation-result';
import {PetriNet} from '../../../../models/pn/model/petri-net';
import {TokenTrailIlpSolver} from '../../../../utility/glpk/token-trail-ilp-solver';
import {from, map, mergeMap, Observable, toArray} from 'rxjs';
import {GLPK, LP} from 'glpk.js';
import {Place} from '../../../../models/pn/model/place';
import {SubjectTo} from '../../../../models/glpk/subject-to';
import {cloneLP} from '../../../../utility/glpk/clone-lp';
import {ProblemSolution} from '../../../../models/glpk/problem-solution';
import {Solution} from '../../../../models/glpk/glpk-constants';
import {SolverConfiguration} from '../../../../utility/glpk/model/solver-configuration';
import {Marking} from '../../../../models/pn/model/marking';


export class TokenTrailValidator extends TokenTrailIlpSolver {

    private _model: PetriNet;
    private readonly _spec: PetriNet;

    constructor(model: PetriNet, spec: PetriNet, _solver$: Observable<GLPK>) {
        super(_solver$);
        this._model = model;
        this._spec = spec;
    }

    public validate(config: SolverConfiguration = {}): Observable<Array<TokenTrailValidationResult>> {
        // construct spec ILP
        const specLP = this.setUpInitialILP(this._spec);

        return from(this._model.getPlaces()).pipe(
            // add constraints for each place in net
            map((place: Place) => {
                const constraints = this.modelPlaceConstraints(place, this._spec);
                const placeLP = cloneLP(specLP);
                placeLP.subjectTo.push(...constraints);
                placeLP.name = place.getId();
                return placeLP;
            }),
            mergeMap((lp: LP) => {
                return this.solveILP(lp, config.messageLevel);
            }),
            // convert solutions to validation results
            map((ps: ProblemSolution) => {
                return new TokenTrailValidationResult(
                    ps.solution.result.status !== Solution.NO_SOLUTION,
                    ps.ilp.name,
                    new Marking(ps.solution.result.vars)
                );
            }),
            toArray()
        )
    }

    protected modelPlaceConstraints(place: Place, specNet: PetriNet): Array<SubjectTo> {
        const result: Array<SubjectTo> = [];
        const unusedTransitionLabels = new Set<string | undefined>(this._model.getLabelCount().keys());
        const inArcs = new Map<string, number>(place.ingoingArcWeights);
        const outArcs = new Map<string, number>(place.outgoingArcWeights);
        const selfLoops = this.findSelfLoops(inArcs, outArcs);

        for (const [tid, weight] of outArcs.entries()) {
            const transition = this._model.getTransition(tid)!;
            unusedTransitionLabels.delete(transition.label!);
            if (!this.definesRiseOfLabel(transition.label!)) {
                continue;
            }

            // arcs coming out of a place consume tokens => negative rise
            result.push(...this.createRiseConstraints(transition.label!, -weight));
        }

        for (const [tid, weight] of inArcs.entries()) {
            const transition = this._model.getTransition(tid)!;
            unusedTransitionLabels.delete(transition.label!);
            if (!this.definesRiseOfLabel(transition.label!)) {
                continue;
            }

            // arcs coming in to a place produce tokens => positive rise
            result.push(...this.createRiseConstraints(transition.label!, weight));
        }

        for (const [tid, [inWeight, outWeight]] of selfLoops.entries()) {
            const transition = this._model.getTransition(tid)!;
            unusedTransitionLabels.delete(transition.label!);
            if (!this.definesRiseOfLabel(transition.label!)) {
                continue;
            }

            // rise is the diff of the tokens produced by ingoing arc and consumed by outgoing arc
            result.push(...this.createRiseConstraints(transition.label!, inWeight - outWeight));

            // the pre-set must contain enough token for the transition to consume => outWeight tokens in preset
            // TODO getByLabel?
            for (const t of specNet.getTransitions()) {
                if (t.label !== transition.label) {
                    continue;
                }

                result.push(
                    ...this.equal(t.ingoingArcs.map(a => this.variable(this.getPlaceVariableId(0, a.sourceId))), outWeight).constraints,
                );
            }
        }

        // transitions that are not connected with the place have no arc => zero rise
        for (const label of unusedTransitionLabels) {
            if (!this.definesRiseOfLabel(label!)) {
                continue;
            }
            result.push(...this.createRiseConstraints(label!, 0));
        }

        // initial marking of the place is the sum of the product of the token trail and the spec marking
        const markedSpecPlaces = specNet.getPlaces().filter(p => p.marking > 0);
        if (markedSpecPlaces.length === 0 && place.marking > 0) {
            throw new Error(`Initial marking of place ${place.id} does not comply with an unmarked specification net!`);
        }
        result.push(...this.equal(markedSpecPlaces.map(p => this.variable(this.getPlaceVariableId(0, p.id!), p.marking)), place.marking).constraints);

        return result;
    }

    private findSelfLoops(inWeights: Map<string, number>, outWeights: Map<string, number>): Map<string, [number, number]> {
        const result = new Map<string, [number, number]>();
        for (const [tid, weight] of inWeights.entries()) {
            if (!outWeights.has(tid)) {
                continue;
            }
            result.set(tid, [weight, outWeights.get(tid)!]);
            inWeights.delete(tid);
            outWeights.delete(tid);
        }
        return result;
    }

    private createRiseConstraints(label: string, rise: number): Array<SubjectTo> {
        // TODO handle transitions with empty pre-/post-set correctly
        const result: Array<SubjectTo> = [];
        const riseSums = this._labelRiseVariables.get(label);
        for (const sum of riseSums) {
            result.push(...this.equal(sum, rise).constraints);
        }
        return result;
    }
}
