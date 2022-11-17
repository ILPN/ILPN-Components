import {Injectable} from '@angular/core';
import {Trace} from '../../../../models/log/model/trace';
import {map, Observable} from 'rxjs';
import {IlpMinerResult} from './ilp-miner-result';
import {IlpSolverService} from '../../../../utility/glpk/ilp-solver.service';
import {cleanLog} from '../../../log/clean-log';
import {IlpMinerIlpSolver} from './ilp-miner-ilp-solver';
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
        const cleanedLog = cleanLog(log);
        const solver = new IlpMinerIlpSolver(this._solver$.asObservable());
        return solver.findSolutions(cleanedLog).pipe(map(solutions => {


            return {
                net: new PetriNet(),
                report: new AlgorithmResult('ILP miner')
            }
        }));
    }
}
