import {PetriNetLayoutManagerFactoryService} from "../petri-net-layout.manager";
import {SugiyamaLayoutManager} from "./sugiyama-layout-manager";
import {Injectable} from "@angular/core";


@Injectable({
    providedIn: 'root'
})
export class SugiyamaLayoutManagerFactoryService extends PetriNetLayoutManagerFactoryService {
    create(): SugiyamaLayoutManager {
        return new SugiyamaLayoutManager();
    }
}
