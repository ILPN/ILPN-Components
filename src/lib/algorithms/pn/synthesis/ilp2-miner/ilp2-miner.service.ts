import {Injectable} from '@angular/core';
import {IlpSolverService} from '../../../../utility/glpk/ilp-solver.service';
import {map, Observable} from 'rxjs';
import {NetAndReport} from '../model/net-and-report';
import {Ilp2MinerIlpSolver} from './ilp2-miner-ilp-solver';
import {PartialOrder} from '../../../../models/po/model/partial-order';
import {PetriNet} from '../../../../models/pn/model/petri-net';
import {Transition} from '../../../../models/pn/model/transition';
import {Place} from '../../../../models/pn/model/place';
import {VariableType} from '../../../../utility/glpk/model/variable-type';
import {DuplicatePlaceRemoverService} from '../../transformation/duplicate-place-remover.service';
import {LogSymbol} from '../../../log/log-symbol';
import {SolverConfiguration} from '../../../../utility/glpk/model/solver-configuration';


@Injectable({
    providedIn: 'root'
})
export class Ilp2MinerService extends IlpSolverService {

    constructor(private _duplicatePlaceRemover: DuplicatePlaceRemoverService) {
        super();
    }

    public mine(pos: Array<PartialOrder> | PetriNet, config: SolverConfiguration = {}): Observable<NetAndReport> {
        const solver = new Ilp2MinerIlpSolver(this._solver$.asObservable());
        return solver.findSolutions(pos, config).pipe(map(solutions => {
            let net = new PetriNet();
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

            net = this._duplicatePlaceRemover.removeDuplicatePlaces(net);
            this.removeArtificialStartTransition(net);

            return {
                net,
                report: [`number of inequalities: ${solutions[0].ilp.subjectTo.length - 2}`, `number of variables: ${solutions[0].ilp.binaries!.length + solutions[0].ilp.generals!.length}`]
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

    private removeArtificialStartTransition(net: PetriNet) {
        const start = net.getTransitions().find(t => t.label === LogSymbol.START);
        if (start === undefined) {
            return;
        }
        for (const outA of start.outgoingArcs) {
            const p = outA.destination as Place;
            p.marking += p.marking + outA.weight;
        }
        for (const inA of start.ingoingArcs) {
            const p = inA.source as Place;
            net.removePlace(p);
        }
        net.removeTransition(start);
    }
}
