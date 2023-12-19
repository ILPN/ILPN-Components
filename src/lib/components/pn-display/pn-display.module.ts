import {NgModule} from "@angular/core";
import {PnDisplayComponent} from "./pn-display.component";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {PetriNetLayoutManagerFactoryService} from "./services/petri-net-layout.manager";
import {ViewBoxPipe} from "./internals/view-box.pipe";
import {
    SpringEmbedderLayoutManagerFactoryService
} from "./services/spring-embedder/spring-embedder-layout-manager-factory.service";

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
        {provide: PetriNetLayoutManagerFactoryService, useExisting: SpringEmbedderLayoutManagerFactoryService}
    ]
})
export class PnDisplayModule {
}
