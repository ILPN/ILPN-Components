import {Observable, Subject} from 'rxjs';

export interface MouseListener {
    bindEvents(mouseMoved$: Subject<MouseEvent>, mouseUp$: Subject<MouseEvent>, kill$: Observable<void>, redraw$: Subject<void>): void;
}
