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
        const specLP = this.setUpInitialILP(this.combineInputNets([this._spec]));

        return from(this._model.getPlaces()).pipe(
            // add constraints for each place in net
            map((place: Place) => {
                const constraints = this.modelPlaceConstraints(place)
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
                return new TokenTrailValidationResult(ps.solution.result.status !== Solution.NO_SOLUTION , ps.ilp.name);
            }),
            toArray()
        )
    }

    protected modelPlaceConstraints(place: Place): Array<SubjectTo> {
        const result: Array<SubjectTo> = [];
        const unusedTransitionLabels = new Set<string | undefined>(this._model.getLabelCount().keys());

        for (const [tid, weight] of place.outgoingArcWeights.entries()) {
            const transition = this._model.getTransition(tid)!;
            const rise = this.getRiseOfLabel(transition.label!);
            unusedTransitionLabels.delete(transition.label!);
            if (rise === undefined) {
                continue;
            }

            // arcs coming out of a place consume tokens => negative rise
            result.push(...this.equal(this.getRiseVariables(transition.label!), -weight).constraints);
        }

        for (const [tid, weight] of place.ingoingArcWeights.entries()) {
            const transition = this._model.getTransition(tid)!;
            const rise = this.getRiseOfLabel(transition.label!);
            unusedTransitionLabels.delete(transition.label!);
            if (rise === undefined) {
                continue;
            }

            // arcs coming in to a place produce tokens => positive rise
            result.push(...this.equal(this.getRiseVariables(transition.label!), weight).constraints);
        }

        // transitions that are not connected with the place have no arc => zero rise
        for (const label of unusedTransitionLabels) {
            const rise = this.getRiseOfLabel(label!);
            if (rise === undefined) {
                continue;
            }
            result.push(...this.equal(this.getRiseVariables(label!), 0).constraints);
        }

        // initial marking of the place is the sum of the product of the token trail and the spec marking
        const markedSpecPlaces = this._spec.getPlaces().filter(p => p.marking > 0);
        if (markedSpecPlaces.length === 0 && place.marking > 0) {
            throw new Error(`Initial marking of place ${place.id} does not comply with an unmarked specification net!`);
        }
        result.push(...this.equal(markedSpecPlaces.map(p => this.variable(p.id!, p.marking)), place.marking).constraints);

        return result;
    }
}
