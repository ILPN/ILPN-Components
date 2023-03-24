import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {PetriNet} from '../../../../models/pn/model/petri-net';
import {IncrementalMiner} from './incremental-miner';
import {PetriNetRegionSynthesisService} from '../../regions/petri-net-region-synthesis.service';
import {ImplicitPlaceRemoverService} from '../../transformation/implicit-place-remover.service';
import {
    PetriNetToPartialOrderTransformerService
} from '../../transformation/petri-net-to-partial-order-transformer.service';


@Injectable({
    providedIn: 'root'
})
export class IncrementalMinerFactoryService {

    constructor(protected _synthesisService: PetriNetRegionSynthesisService,
                protected _implicitPlaceRemover: ImplicitPlaceRemoverService,
                protected _pnToPoTransformer: PetriNetToPartialOrderTransformerService) {
    }

    public create(domain$: Observable<Array<PetriNet>>): IncrementalMiner {
        return new IncrementalMiner(domain$, this._synthesisService, this._implicitPlaceRemover, this._pnToPoTransformer);
    }
}
