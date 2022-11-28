import {Injectable} from '@angular/core';
import {IlpSolverService} from '../../../../utility/glpk/ilp-solver.service';
import {map, Observable} from 'rxjs';
import {NetAndReport} from '../model/net-and-report';
import {IlpplMinerIlpSolver} from './ilppl-miner-ilp-solver';
import {PartialOrder} from '../../../../models/po/model/partial-order';
import {PetriNet} from '../../../../models/pn/model/petri-net';
import {Transition} from '../../../../models/pn/model/transition';
import {Place} from '../../../../models/pn/model/place';
import {VariableType} from '../../../../utility/glpk/model/variable-type';
import {DuplicatePlaceRemoverService} from '../../transformation/duplicate-place-remover.service';
import {GLPK} from 'glpk.js';


@Injectable({
    providedIn: 'root'
})
export class IlpplMinerService extends IlpSolverService {

    constructor(private _duplicatePlaceRemover: DuplicatePlaceRemoverService) {
        super();
    }

    public mine(pos: Array<PartialOrder>): Observable<NetAndReport> {
        if (this._solver$ === undefined) {
            throw new Error('GLPK Solver subject is undefined!');
        }
        return IlpplMinerService.mineWithSolver(pos, this._solver$.asObservable()).pipe(
            map(r => {
                r.net = this._duplicatePlaceRemover.removeDuplicatePlaces(r.net);
                return r;
            })
        );
    }

    public static mineWithSolver(pos: Array<PartialOrder>, solver$: Observable<GLPK>): Observable<NetAndReport> {
        const solver = new IlpplMinerIlpSolver(solver$);
        return solver.findSolutions(pos).pipe(map(solutions => {
            const net = new PetriNet();
            const transitionMap = new Map<string, Transition>();

            for (const placeSolution of solutions) {
                const place = new Place();
                net.addPlace(place);

                // TODO fix the hack, if the goal variables become generals
                const goalVariables = placeSolution.ilp.binaries!;

                Object.entries(placeSolution.solution.result.vars).forEach(([variable, value]) => {
                    if (!goalVariables.some(g => g === variable)) {
                        return;
                    }

                    const decoded = solver.getInverseVariableMapping(variable);
                    let t;
                    if (value === 0) {
                        return;
                    }
                    switch (decoded.type) {
                        case VariableType.INITIAL_MARKING:
                            place.marking = value;
                            return;
                        case VariableType.INGOING_WEIGHT:
                            t = IlpplMinerService.getTransition(decoded.label, net, transitionMap);
                            net.addArc(place, t, value);
                            return;
                        case VariableType.OUTGOING_WEIGHT:
                            t = IlpplMinerService.getTransition(decoded.label, net, transitionMap);
                            net.addArc(t, place, value);
                            return;
                    }
                });
            }

            for (const t of net.getTransitions()) {
                if (t.ingoingArcs.length === 0) {
                    const p = new Place(1);
                    net.addPlace(p);
                    net.addArc(p, t);
                }
                if (t.outgoingArcs.length === 0) {
                    const p = new Place();
                    net.addPlace(p);
                    net.addArc(t, p);
                }
            }

            return {
                net,
                report: [`number of inequalities: ${solutions[0].ilp.subjectTo.length - 2}`, `number of variables: ${solutions[0].ilp.binaries!.length + solutions[0].ilp.generals!.length}`]
            }
        }));
    }

    private static getTransition(label: string, net: PetriNet, map: Map<string, Transition>): Transition {
        let t = map.get(label);
        if (t !== undefined) {
            return t;
        }
        t = new Transition(label);
        net.addTransition(t);
        map.set(label, t);
        return t;
    }
}
