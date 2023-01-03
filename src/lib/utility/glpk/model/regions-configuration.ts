import {SolverConfiguration} from './solver-configuration';


export interface RegionsConfiguration extends SolverConfiguration {
    oneBoundRegions?: boolean;
    noOutputPlaces?: boolean;
    obtainPartialOrders?: boolean;
}
