import {InjectionToken} from '@angular/core';


export const ILPN_DEBUG_CONFIG = new InjectionToken<DebugConfig>('ILPN_DEBUG_CONFIG');

export interface DebugConfig {
    logRegions?: boolean;
}
