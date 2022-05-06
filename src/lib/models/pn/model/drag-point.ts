import {IdPoint} from './id-point';
import {Arc} from './arc';

export class DragPoint extends IdPoint {

    private _arc: Arc | undefined;

    constructor(id: string, x: number, y: number) {
        super(id, x, y);
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
