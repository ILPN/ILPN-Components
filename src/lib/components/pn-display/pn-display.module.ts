import {NgModule} from "@angular/core";
import {PnDisplayComponent} from "./pn-display.component";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {PetriNetLayoutManagerFactoryService} from "./services/petri-net-layout.manager";
import {SugiyamaLayoutManagerFactoryService} from "./services/sugiyama/sugiyama-layout-manager-factory.service";
import {ViewBoxPipe} from "./internals/view-box.pipe";

@NgModule({
    declarations: [
        PnDisplayComponent,
        ViewBoxPipe,
    ],
    imports: [
        BrowserAnimationsModule
    ],
    exports: [
        PnDisplayComponent,
    ],
    providers: [
        {provide: PetriNetLayoutManagerFactoryService, useExisting: SugiyamaLayoutManagerFactoryService}
    ]
})
export class PnDisplayModule {
}
