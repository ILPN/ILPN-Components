import {Subject} from 'rxjs';
import {SvgWrapper} from "../../components/pn-display/svg-net/svg-wrapper";

export interface MouseListener {
    bindEvents(mouseMoved$: Subject<MouseEvent>, mouseUp$: Subject<MouseEvent>, mouseMovedReactionFactory: (svg: SvgWrapper) => (e: MouseEvent) => void): void;
}
