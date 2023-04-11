import {Injectable} from '@angular/core';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {RegionsConfiguration} from '../../../utility/glpk/model/regions-configuration';
import {Observable} from 'rxjs';
import {PetriNetRegion} from './classes/petri-net-region';
import {PetriNetRegionIlpSolver} from './classes/petri-net-region-ilp-solver';
import {IlpSolverService} from '../../../utility/glpk/ilp-solver.service';

@Injectable({
    providedIn: 'root'
})
export class PetriNetRegionsService extends IlpSolverService {

    constructor() {
        super();
    }

    public computeRegions(nets: Array<PetriNet>, config: RegionsConfiguration = {}): Observable<PetriNetRegion> {
        return new PetriNetRegionIlpSolver(this._solver$.asObservable()).computeRegions(nets, config);
    }
}
