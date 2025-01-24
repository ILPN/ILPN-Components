import {BehaviorSubject, Observable, ReplaySubject, switchMap} from 'rxjs';
import {GLPK, LP, Result} from 'glpk.js';
import {PetriNet} from '../../../../models/pn/model/petri-net';
import {ProblemSolution} from '../../../../models/glpk/problem-solution';
import {Solution} from '../../../../models/glpk/glpk-constants';
import {ConstraintsWithNewVariables} from '../../../../models/glpk/constraints-with-new-variables';
import {PetriNetRegion} from './petri-net-region';
import {RegionsConfiguration} from '../../../../utility/glpk/model/regions-configuration';
import {TokenTrailIlpSolver} from '../../../../utility/glpk/token-trail-ilp-solver';
import {Marking} from '../../../../models/pn/model/marking';
import {Flow} from "./flow";


export class PetriNetRegionIlpSolver extends TokenTrailIlpSolver {

    private readonly _transitionLabels: Set<string>;

    constructor(_solver$: Observable<GLPK>, config: RegionsConfiguration = {}) {
        super(_solver$, config);
        this._transitionLabels = new Set<string>();
    }

    public computeRegions(nets: Array<PetriNet>): Observable<PetriNetRegion> {
        this.collectTransitionLabels(nets);
        const regions$ = new ReplaySubject<PetriNetRegion>();
        const ilp$ = new BehaviorSubject(this.setUpInitialILP(nets));
        ilp$.pipe(switchMap(ilp => this.solveILP(ilp, this._config.messageLevel))).subscribe((ps: ProblemSolution) => {
            if (ps.solution.result.status === Solution.OPTIMAL) {
                if (!this._config.logEachRegion) {
                    console.debug('region found'); // show progress
                }
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

    protected override createInitialConstraints(nets: Array<PetriNet>, placeVarIds: Array<string>): ConstraintsWithNewVariables {
        return ConstraintsWithNewVariables.combine(
            super.createInitialConstraints(nets, placeVarIds),
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

        if (this._config.logEachRegion) {
            console.debug('solution', ps.solution.result.vars);
            console.debug('non-zero', regionPlaces);
            console.debug('additional constraint', ilp.subjectTo[ilp.subjectTo.length - 1]);
        }

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
        const rises = new Map<string, Flow>();
        for (const label of this._transitionLabels) {
            const variables = this._labelFlowVariables.get(label);
            if (variables.length === 0) {
                console.warn(`label "${label}" has no rise variables defined!`);
                continue;
            }

            let minInflow = Infinity;
            let minOutflow = Infinity;
            for (const vs of variables) {
                let inflow = 0;
                let outflow = 0;
                for (const v of vs) {
                    const contribution = v.coef * solution.result.vars[v.name];
                    if (contribution < 0) {
                        // inflow has a negative sign because it decreases the rise
                        inflow -= contribution; // sign switched to positive
                    } else {
                        outflow += contribution;
                    }
                }
                if (inflow < minInflow) {
                    minInflow = inflow;
                    minOutflow = outflow;
                }
                if (minInflow === 0) {
                    // 0 is a global minimum, we can skip the rest
                    break;
                }
            }

            if (variables.length === 0) {
                // if length is non-zero, minInflow and minOutflow are not Infinity
                console.warn(`Inflow of transition labelled '${label}' could not be determined. Likely a disconnected transition in the specification!`);

                // inflow and outflow is 0 => disconnected in the result
                minInflow = 0;
                minOutflow = 0;
            }

            rises.set(label, {inflow: minInflow, outflow: minOutflow});
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
