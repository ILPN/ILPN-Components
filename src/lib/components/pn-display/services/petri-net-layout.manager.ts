import {SvgPetriNet} from "../svg-net/svg-petri-net";
import {Observable} from "rxjs";
import {BoundingBox} from "../../../utility/svg/bounding-box";
import {SvgWrapper} from "../svg-net/svg-wrapper";

export abstract class PetriNetLayoutManagerFactoryService {
    public abstract create(): PetriNetLayoutManager;
}

export abstract class PetriNetLayoutManager {

    public abstract layout(net: SvgPetriNet): Observable<BoundingBox>;

    /**
     * Places the new net in such a way, that it resembles the previous net as much as possible.
     */
    public overlayLayout(net: SvgPetriNet): Observable<BoundingBox> {
        console.debug('overlayLayout is not supported! Running standard layout instead');
        return this.layout(net);
    }

    public abstract getMouseMovedReaction(wrapper: SvgWrapper): (e: MouseEvent) => void;

    public destroy() {
    }

    protected computeBoundingBox(nodes: Array<SvgWrapper>): BoundingBox {
        const r = {
            tl: {x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY},
            br: {x: Number.NEGATIVE_INFINITY, y: Number.NEGATIVE_INFINITY},
        };

        for (const n of nodes) {
            r.tl.x = Math.min(r.tl.x, n.x);
            r.tl.y = Math.min(r.tl.y, n.y);
            r.br.x = Math.max(r.br.x, n.x);
            r.br.y = Math.max(r.br.y, n.y);
        }

        return r;
    }
}
