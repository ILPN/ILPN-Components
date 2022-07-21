import {IdPoint} from './id-point';
import {Arc} from './arc';

export class DragPoint extends IdPoint {

    private _arc: Arc | undefined;

    constructor(x: number, y: number, id?: string) {
        super(x, y, id);
    }

    public addArcRef(arc: Arc) {
        this._arc = arc;
    }

    protected override svgX(): string {
        return 'cx';
    }

    protected override svgY(): string {
        return 'cy';
    }
}
