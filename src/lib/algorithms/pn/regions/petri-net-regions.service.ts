import {Injectable} from '@angular/core';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {RegionsConfiguration} from './classes/regions-configuration';
import {Observable} from 'rxjs';
import {Region} from './classes/region';
import {RegionIlpSolver} from './classes/region-ilp-solver';
import {PetriNetRegionTransformerService} from './petri-net-region-transformer.service';
import {IlpSolverService} from '../../../utility/glpk/ilp-solver.service';

@Injectable({
    providedIn: 'root'
})
export class PetriNetRegionsService extends IlpSolverService {

    constructor(private _regionTransformer: PetriNetRegionTransformerService) {
        super();
    }

    public computeRegions(nets: Array<PetriNet>, config: RegionsConfiguration): Observable<Region> {
        if (this._solver$ === undefined) {
            throw new Error('GLPK Solver subject is undefined!');
        }

        return new RegionIlpSolver(this._regionTransformer, this._solver$.asObservable()).computeRegions(nets, config);
    }
}
