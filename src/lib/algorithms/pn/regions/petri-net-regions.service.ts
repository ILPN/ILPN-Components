import {Injectable} from '@angular/core';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {RegionsConfiguration} from './classes/regions-configuration';
import {Observable} from 'rxjs';
import {Region} from './classes/region';

@Injectable({
    providedIn: 'root'
})
export class PetriNetRegionsService {

    constructor() {
    }

    public computeRegions(nets: Array<PetriNet>, config: RegionsConfiguration): Observable<Region> {

    }
}
