import {SolverConfiguration} from './solver-configuration';


export interface RegionsConfiguration extends SolverConfiguration {
    noArcWeights?: boolean | null;
    noOutputPlaces?: boolean | null;
    obtainPartialOrders?: boolean | null;

    logEachRegion?: boolean | null;
}
