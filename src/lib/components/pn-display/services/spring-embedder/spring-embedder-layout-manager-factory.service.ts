import {Injectable} from "@angular/core";
import {PetriNetLayoutManagerFactoryService} from "../petri-net-layout.manager";
import {SpringEmbedderLayoutManager} from "./spring-embedder-layout-manager";


@Injectable({
    providedIn: 'root'
})
export class SpringEmbedderLayoutManagerFactoryService extends PetriNetLayoutManagerFactoryService {
    create(): SpringEmbedderLayoutManager {
        return new SpringEmbedderLayoutManager();
    }

}
