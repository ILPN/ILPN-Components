import {SvgWrapper} from './svg-wrapper';
import {DRAG_POINT_STYLE} from '../internals/constants/drag-point-style';
import {ZoomWrapper} from "../internals/model/zoom-wrapper";


export class DragPoint extends SvgWrapper {

    constructor(id?: string, zoomWrapper?: ZoomWrapper) {
        super(id, zoomWrapper);

        const dragPoint = this.createSvgElement('circle');
        this.applyStyle(dragPoint, DRAG_POINT_STYLE);
        dragPoint.classList.add('drag-point', SvgWrapper.CSS_DRAGGABLE);
        this.registerMainElement(dragPoint);
    }

    protected override svgX(): string {
        return 'cx';
    }

    protected override svgY(): string {
        return 'cy';
    }
}
