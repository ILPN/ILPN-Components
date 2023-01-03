import {BehaviorSubject, Observable, ReplaySubject, switchMap} from 'rxjs';
import {GLPK, LP} from 'glpk.js';
import {PetriNet} from '../../../../models/pn/model/petri-net';
import {ProblemSolution} from '../../../../models/glpk/problem-solution';
import {Solution} from '../../../../models/glpk/glpk-constants';
import {ConstraintsWithNewVariables} from '../../../../models/glpk/constraints-with-new-variables';
import {PetriNetRegionTransformerService} from '../petri-net-region-transformer.service';
import {Region} from './region';
import {RegionsConfiguration} from '../../../../utility/glpk/model/regions-configuration';
import {TokenTrailIlpSolver} from '../../../../utility/glpk/token-trail-ilp-solver';


export class RegionIlpSolver extends TokenTrailIlpSolver {

    constructor(private _regionTransformer: PetriNetRegionTransformerService, _solver$: Observable<GLPK>) {
        super(_solver$);
    }

    public computeRegions(nets: Array<PetriNet>, config: RegionsConfiguration = {}): Observable<Region> {

        const regions$ = new ReplaySubject<Region>();

        const combined = this.combineInputNets(nets);

        const ilp$ = new BehaviorSubject(this.setUpInitialILP(combined, config));
        ilp$.pipe(switchMap(ilp => this.solveILP(ilp, config.messageLevel))).subscribe((ps: ProblemSolution) => {
            if (ps.solution.result.status === Solution.OPTIMAL) {
                const region = this._regionTransformer.displayRegionInNet(ps.solution, combined.net);

                // TODO check if the region is new and we are not trapped in a loop

                const nonEmptyInputSet = combined.inputs.find(inputs => inputs.size > 0) ?? [];

                regions$.next({net: region, inputs: Array.from(nonEmptyInputSet)});
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

    private addConstraintsToILP(ps: ProblemSolution): LP {
        const ilp = ps.ilp;

        // no region that contains the new solution as subset
        const region = ps.solution.result.vars;
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
}
