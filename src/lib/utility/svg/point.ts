export interface Point {
    x: number;
    y: number;
}


export function computeDeltas(start: Point, end: Point): Point {
    return {
        x: end.x - start.x,
        y: end.y - start.y
    };
}
