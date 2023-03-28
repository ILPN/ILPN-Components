import {Injectable} from '@angular/core';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {Observable, ReplaySubject} from 'rxjs';
import {SynthesisResult} from './classes/synthesis-result';
import {PetriNetRegionSynthesiser} from './classes/petri-net-region-synthesiser';
import {RegionsConfiguration} from '../../../utility/glpk/model/regions-configuration';
import {PetriNetRegionsService} from './petri-net-regions.service';
import {PetriNetSerialisationService} from '../../../models/pn/parser/petri-net-serialisation.service';
import {arraify} from '../../../utility/arraify';

@Injectable({
    providedIn: 'root'
})
export class PetriNetRegionSynthesisService {

    constructor(private _regionService: PetriNetRegionsService, private _serializer: PetriNetSerialisationService) {
    }

    public synthesise(input: PetriNet | Array<PetriNet>, config: RegionsConfiguration = {}, fileName: string = 'result'): Observable<SynthesisResult> {
        const result$ = new ReplaySubject<SynthesisResult>(1);
        const synthesiser = new PetriNetRegionSynthesiser();

        const arrayInput = arraify(input);

        this._regionService.computeRegions(arrayInput, config).subscribe({
            next: region => {
                synthesiser.addRegion(region);
                // TODO configurable log serialized net - makes debugging easier
                console.debug(region);
            },
            complete: () => {
                result$.next(new SynthesisResult(arrayInput, synthesiser.synthesise(), fileName));
                result$.complete();
            }
        });

        return result$.asObservable();
    }
}
