import {Injectable} from '@angular/core';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {RegionsConfiguration} from './classes/regions-configuration';
import {Observable} from 'rxjs';
import {Region} from './classes/region';
import {RegionIlpSolver} from './classes/region-ilp-solver';
import {PetriNetRegionTransformerService} from './petri-net-region-transformer.service';

@Injectable({
    providedIn: 'root'
})
export class PetriNetRegionsService {

    constructor(private _regionTransformer: PetriNetRegionTransformerService) {
    }

    public computeRegions(nets: Array<PetriNet>, config: RegionsConfiguration): Observable<Region> {
        return new RegionIlpSolver(this._regionTransformer).computeRegions(nets, config);
    }
}
