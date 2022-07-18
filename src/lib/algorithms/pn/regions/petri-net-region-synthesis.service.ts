import {Injectable} from '@angular/core';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {Observable, ReplaySubject} from 'rxjs';
import {SynthesisResult} from './classes/synthesis-result';
import {RegionSynthesiser} from './classes/region-synthesiser';
import {RegionsConfiguration} from './classes/regions-configuration';
import {PetriNetRegionsService} from './petri-net-regions.service';
import {PetriNetSerialisationService} from '../../../models/pn/parser/petri-net-serialisation.service';

@Injectable({
    providedIn: 'root'
})
export class PetriNetRegionSynthesisService {

    constructor(private _regionService: PetriNetRegionsService, private _serializer: PetriNetSerialisationService) {
    }

    public synthesise(input: PetriNet | Array<PetriNet>, config: RegionsConfiguration = {}, fileName: string = 'result'): Observable<SynthesisResult> {
        const result$ = new ReplaySubject<SynthesisResult>(1);
        const synthesiser = new RegionSynthesiser();

        const arrayInput = Array.isArray(input) ? input : [input];

        this._regionService.computeRegions(arrayInput, config).subscribe({
            next: region => {
                synthesiser.addRegion(region);
                console.debug(this._serializer.serialise(region.net));
            },
            complete: () => {
                result$.next(new SynthesisResult(arrayInput, synthesiser.synthesise(), fileName));
                result$.complete();
            }
        });

        return result$.asObservable();
    }
}
