import {Injectable} from "@angular/core";
import {Trace} from "../../models/log/model/trace";
import {LogTransformerConfiguration} from "./model/log-transformer-configuration";
import {cleanLog} from "./clean-log";
import {filterUniqueTraces} from "./unique-traces";
import {PetriNet} from "../../models/pn/model/petri-net";
import {Transition} from "../../models/pn/model/transition";
import {Place} from "../../models/pn/model/place";
import {LogSymbol} from "./model/log-symbol";



export enum SequenceNetStructure {
    STANDALONE,
    TRACE_MODEL,
    // PREFIX_TREE
}

export interface LogToSequenceNetTransformerConfiguration extends LogTransformerConfiguration {
    /**
     * decides if the traces should be aggregated and how.
     *
     * If `STANDALONE`, then each trace is a standalone net.
     *
     * If `TRACE_MODEL`, then the traces are combined into a single net and their initial and final places are merged together.
     */
    traceAggregation?: SequenceNetStructure
}


@Injectable({
    providedIn: 'root'
})
export class LogToSequenceNetTransformerService {

    private static DEFAULT_CONFIG: LogToSequenceNetTransformerConfiguration = {
        traceAggregation: SequenceNetStructure.STANDALONE
    }

    /**
     * Converts each unique non-empty trace into a sequence labeled Petri net with an identical order of labeled transitions.
     * @param log
     * @param config
     *
     * @returns an empty array if the input is empty.
     * Otherwise, one net per unique non-empty input trace, or an array with a single net if nets should be aggregated.
     */
    public transformToSequenceNets(log: Array<Trace>, config: LogToSequenceNetTransformerConfiguration = {}): Array<PetriNet> {
        if (log.length === 0) {
            return [];
        }

        config = Object.assign(
            Object.assign({}, LogToSequenceNetTransformerService.DEFAULT_CONFIG),
            config
        );

        if (!!config.cleanLog) {
            log = cleanLog(log);
        }

        const unique = filterUniqueTraces(log, !!config.discardPrefixes).filter(t => t.length() > 0);
        if (unique.length === 0) {
            return [];
        }

        switch (config.traceAggregation as SequenceNetStructure) {
            case SequenceNetStructure.STANDALONE:
                return this.convertToStandaloneNets(unique, config).map(tripple => tripple[0]);
            case SequenceNetStructure.TRACE_MODEL:
                return this.convertToTraceModel(unique, config);
        }
    }

    protected convertToStandaloneNets(traces: Array<Trace>, config: LogToSequenceNetTransformerConfiguration, omitIO = false): Array<[net: PetriNet, tI: Transition, tO: Transition]> {
        return traces.map(tr => {
            let [pn, tI, tO] = this.convertTraceToSequenceNet(tr, omitIO);
            if (config.addStartStopEvent) {
                [tI, tO] = this.addStartStopTransitions(pn, tI, tO);
            }
            return [pn, tI, tO];
        });
    }

    protected convertToTraceModel(traces: Array<Trace>, config: LogToSequenceNetTransformerConfiguration): Array<PetriNet> {
        const sequenceNets = this.convertToStandaloneNets(traces, config, true);
        const traceModel = PetriNet.multipleNetUnion(...(sequenceNets.map(tripple => tripple[0])));
        const [pI, pO] = this.addPlacesIO(traceModel);

        for (let i = 0; i < sequenceNets.length; i++) {
            traceModel.addArc(pI, traceModel.getTransition(`${i}_${sequenceNets[i][1].getId()}`)!);
            traceModel.addArc(traceModel.getTransition(`${i}_${sequenceNets[i][2].getId()}`)!, pO);
        }

        return [traceModel];
    }

    protected convertTraceToSequenceNet(trace: Trace, omitIO = false): [pn: PetriNet, tI: Transition, tO: Transition] {
        const result = new PetriNet();

        // input and output transitions. Output transition doubles as previous in iteration
        let tI: Transition | undefined = undefined;
        let tO: Transition | undefined = undefined;

        for (let i = 0; i < trace.length(); i++) {
            const t = new Transition(trace.get(i));
            if (tI === undefined) {
                tI = t;
            }
            result.addTransition(t);
            if (tO !== undefined) {
                const p = new Place();
                result.addPlace(p);
                result.addArc(tO, p);
                result.addArc(p, t);
            }
            tO = t;
        }

        if (!omitIO) {
            const [pI, pO] = this.addPlacesIO(result);
            result.addArc(pI, tI!);
            result.addArc(tO!, pO);
        }
        return [result, tI!, tO!];
    }

    protected addStartStopTransitions(net: PetriNet, tI: Transition, tO: Transition): [tStart: Transition, tStop: Transition] {
        const pI = net.getPlace('i');
        const pO = net.getPlace('o');
        if (pI && pO) {
            net.removeArc(pI, tI);
            net.removeArc(tO, pO);
        }

        const tStart = new Transition(LogSymbol.START, 'start');
        net.addTransition(tStart);
        if (pI) {
            net.addArc(pI, tStart);
        }
        let p = new Place();
        net.addPlace(p);
        net.addArc(tStart, p);
        net.addArc(p, tI);

        const tStop = new Transition(LogSymbol.STOP, 'stop');
        net.addTransition(tStop);
        if (pO) {
            net.addArc(tStop, pO);
        }
        p = new Place();
        net.addPlace(p);
        net.addArc(tO, p);
        net.addArc(p, tStop);

        return [tStart, tStop];
    }

    protected addPlacesIO(net: PetriNet): [pI: Place, pO: Place] {
        const pI = new Place(1, 'i');
        net.addPlace(pI);
        const pO = new Place(0, 'o');
        net.addPlace(pO);
        return [pI, pO];
    }
}
