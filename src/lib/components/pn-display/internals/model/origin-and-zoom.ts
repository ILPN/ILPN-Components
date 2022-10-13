import {Point} from '../../../../models/pn/model/point';

export class OriginAndZoom implements Point {
    constructor(public x: number,
                public y: number,
                public zoom: number,
                public width = 1,
                public height = 1) {
    }

    public update(change: { x?: number, y?: number, zoom?: number , width?: number, height?: number}): OriginAndZoom {
        return new OriginAndZoom(
            change.x ?? this.x,
            change.y ?? this.y,
            change.zoom ?? this.zoom,
            change.width ?? this.width,
            change.height ?? this.height
        );
    }
}
