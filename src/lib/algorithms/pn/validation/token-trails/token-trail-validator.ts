import {TokenTrailValidationResult} from '../classes/validation-result';
import {PetriNet} from '../../../../models/pn/model/petri-net';
import {TokenTrailIlpSolver} from '../../../../utility/glpk/token-trail-ilp-solver';
import {from, map, Observable, switchMap, toArray} from 'rxjs';
import {GLPK, LP} from 'glpk.js';
import {Place} from '../../../../models/pn/model/place';
import {SubjectTo} from '../../../../models/glpk/subject-to';
import {cloneLP} from '../../../../utility/glpk/clone-lp';
import {ProblemSolution} from '../../../../models/glpk/problem-solution';
import {Solution} from '../../../../models/glpk/glpk-constants';


export class TokenTrailValidator extends TokenTrailIlpSolver {

    private _model: PetriNet;
    private readonly _specs: Array<PetriNet>;

    constructor(model: PetriNet, specs: Array<PetriNet>, _solver$: Observable<GLPK>) {
        super(_solver$);
        this._model = model;
        this._specs = specs;
    }

    public validate(): Observable<Array<TokenTrailValidationResult>> {
        // construct spec ILP
        const specLP = this.setUpInitialILP(this.combineInputNets(this._specs));

        return from(this._model.getPlaces()).pipe(
            // add constraints for each place in net
            map((place: Place) => {
                const constraints = this.modelPlaceRestrictions(place)
                const placeLP = cloneLP(specLP);
                placeLP.subjectTo.push(...constraints);
                placeLP.name = place.getId();
                return placeLP;
            }),
            switchMap((lp: LP) => {
                return this.solveILP(lp);
            }),
            // convert solutions to validation results
            map((ps: ProblemSolution) => {
                return new TokenTrailValidationResult(ps.solution.result.status !== Solution.NO_SOLUTION , ps.ilp.name);
            }),
            toArray()
        )
    }

    protected modelPlaceRestrictions(place: Place): Array<SubjectTo> {
        return [];
    }
}
