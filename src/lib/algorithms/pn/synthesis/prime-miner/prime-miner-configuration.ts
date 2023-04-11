import {RegionsConfiguration} from '../../../../utility/glpk/model/regions-configuration';

export interface PrimeMinerConfiguration extends RegionsConfiguration {
    skipConnectivityCheck?: boolean;
}
