import {Injectable} from '@angular/core';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {PetriNetRegionsService} from './petri-net-regions.service';
import {Observable, ReplaySubject} from 'rxjs';
import {SynthesisResult} from './classes/synthesis-result';
import {RegionSynthesiser} from './classes/region-synthesiser';

@Injectable({
    providedIn: 'root'
})
export class PetriNetRegionSynthesisService {

    constructor(private _regionService: PetriNetRegionsService) {
    }

    public synthesise(input: PetriNet, oneBoundRegions: boolean, fileName: string = 'result'): Observable<SynthesisResult> {
        const result$ = new ReplaySubject<SynthesisResult>(1);
        const synthesiser = new RegionSynthesiser();

        this._regionService.computeRegions(input, oneBoundRegions).subscribe({
            next: region => {
                synthesiser.addRegion(region);
            },
            complete: () => {
                result$.next(new SynthesisResult(input, synthesiser.synthesise(), fileName));
                result$.complete();
            }
        });

        return result$.asObservable();
    }
}
