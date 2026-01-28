import {SolverConfiguration} from './solver-configuration';


export interface RegionsConfiguration extends SolverConfiguration {
    noArcWeights?: boolean | null;
    /**
     * places with empty post-set should be empty
     */
    noOutputPlaces?: boolean | null;
    obtainPartialOrders?: boolean | null;

    logEachRegion?: boolean | null;
}
