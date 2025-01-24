import {Inject, Injectable, Optional} from '@angular/core';
import {PetriNet} from '../../../models/pn/model/petri-net';
import {Observable, ReplaySubject} from 'rxjs';
import {SynthesisResult} from './classes/synthesis-result';
import {PetriNetRegionSynthesiser} from './classes/petri-net-region-synthesiser';
import {RegionsConfiguration} from '../../../utility/glpk/model/regions-configuration';
import {PetriNetRegionsService} from './petri-net-regions.service';
import {PetriNetSerialisationService} from '../../../models/pn/io/serialiser/petri-net-serialisation.service';
import {arraify} from '../../../utility/arraify';
import {IlpnAlgorithmsModule} from '../../ilpn-algorithms.module';
import {DebugConfig, ILPN_DEBUG_CONFIG} from '../../configuration/config-token';
import {PetriNetRegion} from './classes/petri-net-region';
import {SynthesisConfiguration} from "./classes/synthesis-configuration";


@Injectable({
    providedIn: IlpnAlgorithmsModule
})
export class PetriNetRegionSynthesisService {

    private readonly _debug: boolean;

    constructor(private _regionService: PetriNetRegionsService,
                private _serializer: PetriNetSerialisationService,
                @Optional() @Inject(ILPN_DEBUG_CONFIG) debugConfig: DebugConfig) {
        this._debug = !!debugConfig?.logRegions;
    }

    public synthesise(input: PetriNet | Array<PetriNet>, config: RegionsConfiguration & SynthesisConfiguration = {}, fileName: string = 'result'): Observable<SynthesisResult> {
        const result$ = new ReplaySubject<SynthesisResult>(1);
        const synthesiser = new PetriNetRegionSynthesiser();

        const arrayInput = arraify(input);

        this._regionService.computeRegions(arrayInput, config).subscribe({
            next: region => {
                synthesiser.addRegion(region);
                if (this._debug) {
                    this.logRegion(region);
                }
            },
            complete: () => {
                result$.next(new SynthesisResult(arrayInput, synthesiser.synthesise(config), fileName));
                result$.complete();
            }
        });

        return result$.asObservable();
    }

    private logRegion(region: PetriNetRegion) {
        console.debug('================= REGION =================');
        console.debug(region);
        for (let i = 0; i < region.netAndMarking.length; i++) {
            const nm = region.netAndMarking[i];
            console.debug(`--------------- NET ${i} ---------------`)
            const oldM = nm.net.applyMarking(nm.marking);
            console.debug(this._serializer.serialise(nm.net));
            nm.net.applyMarking(oldM);
        }
    }
}
