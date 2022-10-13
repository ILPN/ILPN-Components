import {RegionsConfiguration} from '../regions/classes/regions-configuration';

export interface PrimeMinerConfiguration extends RegionsConfiguration {
    skipConnectivityCheck?: boolean;
}
