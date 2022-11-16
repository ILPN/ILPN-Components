import {Injectable} from '@angular/core';
import {Trace} from '../../../../models/log/model/trace';
import {map, Observable} from 'rxjs';
import {IlpMinerResult} from './ilp-miner-result';
import {IlpSolverService} from '../../../../utility/ilp-solver.service';
import {PetriNet} from '../../../../models/pn/model/petri-net';
import {AlgorithmResult} from '../../../../utility/algorithm-result';


@Injectable({
    providedIn: 'root'
})
export class IlpMinerService extends IlpSolverService {

    constructor() {
        super();
    }

    public mine(log: Array<Trace>): Observable<IlpMinerResult> {
        return this._solver$.pipe(map(solver => {






            return {
                net: new PetriNet(),
                report: new AlgorithmResult('ILP miner'),
            };
        }));
    }
}
