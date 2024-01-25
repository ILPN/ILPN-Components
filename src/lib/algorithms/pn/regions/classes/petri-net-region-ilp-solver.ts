import {BehaviorSubject, config, Observable, ReplaySubject, switchMap} from 'rxjs';
import {GLPK, LP, Result} from 'glpk.js';
import {PetriNet} from '../../../../models/pn/model/petri-net';
import {ProblemSolution} from '../../../../models/glpk/problem-solution';
import {Solution} from '../../../../models/glpk/glpk-constants';
import {ConstraintsWithNewVariables} from '../../../../models/glpk/constraints-with-new-variables';
import {PetriNetRegion} from './petri-net-region';
import {RegionsConfiguration} from '../../../../utility/glpk/model/regions-configuration';
import {TokenTrailIlpSolver} from '../../../../utility/glpk/token-trail-ilp-solver';
import {Marking} from '../../../../models/pn/model/marking';


export class PetriNetRegionIlpSolver extends TokenTrailIlpSolver {

    private readonly _transitionLabels: Set<string>;

    constructor(_solver$: Observable<GLPK>) {
        super(_solver$);
        this._transitionLabels = new Set<string>();
    }

    public computeRegions(nets: Array<PetriNet>, config: RegionsConfiguration = {}): Observable<PetriNetRegion> {
        this.collectTransitionLabels(nets);
        const regions$ = new ReplaySubject<PetriNetRegion>();
        const ilp$ = new BehaviorSubject(this.setUpInitialILP(nets, config));
        ilp$.pipe(switchMap(ilp => this.solveILP(ilp, config.messageLevel))).subscribe((ps: ProblemSolution) => {
            if (ps.solution.result.status === Solution.OPTIMAL) {
                regions$.next(this.extractRegionFromSolution(nets, ps.solution));
                ilp$.next(this.addConstraintsToILP(ps));
            } else {
                // we are done, there are no more regions
                console.debug('final non-optimal result', ps.solution);
                regions$.complete();
                ilp$.complete();
            }
        });

        return regions$.asObservable();
    }

    protected override createInitialConstraints(nets: Array<PetriNet>, placeVarIds: Array<string>, config: RegionsConfiguration): ConstraintsWithNewVariables {
        return ConstraintsWithNewVariables.combine(
            super.createInitialConstraints(nets, placeVarIds, config),
            // non-zero solutions
            this.greaterEqualThan(placeVarIds.map(vid => this.variable(vid)), 1)
        );
    }

    private addConstraintsToILP(ps: ProblemSolution): LP {
        const ilp = ps.ilp;

        // no region that contains the new solution as subset
        const region = ps.solution.result.vars;
        // TODO restrict rises and not markings?
        const regionPlaces = Object.entries(region).filter(([k, v]) => v != 0 && this._placeVariables.has(k));
        const additionalConstraints = regionPlaces.map(([k, v]) => this.yWhenAGreaterEqualB(k, v));

        const yVariables =
            additionalConstraints
                .reduce(
                    (arr, constraint) => {
                        arr.push(...constraint.binaryVariables);
                        return arr;
                    }, [] as Array<string>)
                .map(
                    y => this.variable(y)
                );
        /*
            Sum of x-es should be less than their number
            x = 1 - y
            Therefore sum of y should be greater than 0
         */
        additionalConstraints.push(this.sumGreaterThan(yVariables, 0));
        this.applyConstraints(ilp, ConstraintsWithNewVariables.combine(...additionalConstraints));

        console.debug('solution', ps.solution.result.vars);
        console.debug('non-zero', regionPlaces);
        console.debug('additional constraint', ilp.subjectTo[ilp.subjectTo.length - 1]);

        return ilp;
    }

    private collectTransitionLabels(nets: Array<PetriNet>) {
        this._transitionLabels.clear();
        for (const net of nets) {
            for (const t of net.getTransitions()) {
                if (t.label === undefined) {
                    throw new Error(`Transition with id '${t.id}' has no label! All transitions must be labeled in the input nets!`);
                }
                this._transitionLabels.add(t.label);
            }
        }
    }

    private extractRegionFromSolution(nets: Array<PetriNet>, solution: Result): PetriNetRegion {
        const rises = new Map<string, number>();
        for (const label of this._transitionLabels) {
            const variables = this._labelRiseVariables.get(label);
            if (variables.length === 0) {
                console.warn(`label "${label}" has no rise variables defined!`);
                continue;
            }
            let sum = 0;
            for (const v of variables[0]) {
                sum += v.coef * solution.result.vars[v.name];
            }
            rises.set(label, sum);
        }

        const netAndMarking: Array<{ net: PetriNet, marking: Marking }> = [];
        for (let i = 0; i < nets.length; i++) {
            const net = nets[i];
            const marking = new Marking();
            for (const p of net.getPlaces()) {
                marking.set(p.getId(), solution.result.vars[this.getPlaceVariableId(i, p)]);
            }
            netAndMarking.push({net, marking});
        }

        return {
            netAndMarking,
            rises,
            indexWithInitialStates: this._indexWithInitialStates
        };
    }
}
