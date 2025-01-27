import {SolverConfiguration} from './solver-configuration';


export interface RegionsConfiguration extends SolverConfiguration {
    noArcWeights?: boolean;
    noOutputPlaces?: boolean;
    obtainPartialOrders?: boolean;

    logEachRegion?: boolean;
}
