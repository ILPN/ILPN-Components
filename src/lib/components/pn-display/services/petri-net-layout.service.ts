import {SvgPetriNet} from "../svg-net/svg-petri-net";
import {Observable} from "rxjs";
import {Point} from "../../../utility/svg/point";

export abstract class PetriNetLayoutService {

    public abstract layout(net: SvgPetriNet): Observable<Point>;

}
