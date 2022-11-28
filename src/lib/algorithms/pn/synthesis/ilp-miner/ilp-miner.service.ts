import {Injectable} from '@angular/core';
import {Trace} from '../../../../models/log/model/trace';
import {map, Observable} from 'rxjs';
import {NetAndReport} from '../model/net-and-report';
import {IlpSolverService} from '../../../../utility/glpk/ilp-solver.service';
import {cleanLog} from '../../../log/clean-log';
import {IlpMinerIlpSolver} from './ilp-miner-ilp-solver';
import {PetriNet} from '../../../../models/pn/model/petri-net';
import {Place} from '../../../../models/pn/model/place';
import {Transition} from '../../../../models/pn/model/transition';
import {VariableType} from '../../../../utility/glpk/model/variable-type';
import {DuplicatePlaceRemoverService} from '../../transformation/duplicate-place-remover.service';


@Injectable({
    providedIn: 'root'
})
export class IlpMinerService extends IlpSolverService {

    constructor(private _duplicatePlaceRemover: DuplicatePlaceRemoverService) {
        super();
    }

    public mine(log: Array<Trace>): Observable<NetAndReport> {
        if (this._solver$ === undefined) {
            throw new Error('GLPK Solver subject is undefined!');
        }

        const cleanedLog = cleanLog(log);
        const solver = new IlpMinerIlpSolver(this._solver$.asObservable());
        return solver.findSolutions(cleanedLog).pipe(map(solutions => {
            const net = new PetriNet();
            const transitionMap = new Map<string, Transition>();

            for (const placeSolution of solutions) {
                const place = new Place();
                net.addPlace(place);

                Object.entries(placeSolution.solution.result.vars).forEach(([variable, value]) => {
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
                            t = this.getTransition(decoded.label, net, transitionMap);
                            net.addArc(place, t, value);
                            return;
                        case VariableType.OUTGOING_WEIGHT:
                            t = this.getTransition(decoded.label, net, transitionMap);
                            net.addArc(t, place, value);
                            return;
                    }
                });
            }

            solutions[0].ilp.subjectTo.length - 2;

            return {
                net: this._duplicatePlaceRemover.removeDuplicatePlaces(net),
                report: []
            }
        }));
    }

    private getTransition(label: string, net: PetriNet, map: Map<string, Transition>): Transition {
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
