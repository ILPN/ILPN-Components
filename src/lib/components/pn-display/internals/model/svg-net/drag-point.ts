import {SvgWrapper} from './svg-wrapper';
import {DRAG_POINT_STYLE} from '../../constants/drag-point-style';
import {Subscription} from 'rxjs';


export class DragPoint extends SvgWrapper {

    private _sub: Subscription;

    constructor(id?: string) {
        super(id);

        const dragPoint = this.createSvgElement('circle');
        this.applyStyle(dragPoint, DRAG_POINT_STYLE);
        dragPoint.classList.add('drag-point');
        this._sub = this.center$.subscribe(c => {
            dragPoint.setAttribute('cx', '' + c.x);
            dragPoint.setAttribute('cy', '' + c.y);
        });
        this.registerMainElement(dragPoint);
    }

    override destroy() {
        super.destroy();
        this._sub.unsubscribe();
    }

    protected override svgX(): string {
        return 'cx';
    }

    protected override svgY(): string {
        return 'cy';
    }
}
