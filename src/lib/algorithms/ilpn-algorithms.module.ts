import {ModuleWithProviders, NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {DebugConfig, ILPN_DEBUG_CONFIG} from './configuration/config-token';


@NgModule({
    declarations: [],
    imports: [
        CommonModule
    ]
})
export class IlpnAlgorithmsModule {

    static withDebugConfig(config: DebugConfig): ModuleWithProviders<IlpnAlgorithmsModule> {
        return {
            ngModule: IlpnAlgorithmsModule,
            providers: [
                {provide: ILPN_DEBUG_CONFIG, useValue: config}
            ]
        }
    }

}
