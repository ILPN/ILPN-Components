import {NgModule} from "@angular/core";
import {PnDisplayComponent} from "./pn-display.component";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {PetriNetLayoutService} from "./services/petri-net-layout.service";
import {SugiyamaLayoutService} from "./services/sugiyama-layout.service";
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
        {provide: PetriNetLayoutService, useExisting: SugiyamaLayoutService}
    ]
})
export class PnDisplayModule {
}
