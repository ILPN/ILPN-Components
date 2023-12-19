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

/**
 * Computes the Euclidean distance between two points, or from a vector of deltas of two points.
 *
 * @param startOrDeltas either a vector of deltas or a starting point
 * @param end if provided, then the first argument is interpreted as a starting point, if not, then it is interpreted as a vector of deltas
 */
export function computeDistance(startOrDeltas: Point, end?: Point): number {
    let deltas = startOrDeltas;
    if (end !== undefined) {
        deltas = computeDeltas(startOrDeltas, end);
    }
    return Math.sqrt(deltas.x * deltas.x + deltas.y * deltas.y);
}

/**
 * Changes coordinates of A to be A + coef * B
 */
export function addPoints(a: Point, b: Point, coef = 1) {
    a.x += coef * b.x;
    a.y += coef * b.y;
}

const EPSILON = 1/1024;

/**
 * @returns `true` if two vectors (determined by the deltas) are parallel with some tolerance, `false` otherwise.
 * The result is direction sensitive i.e. two vectors that point in opposite directions return `false`.
 */
export function areVectorsParallel(deltas1: Point, deltas2: Point): boolean {
    // from https://stackoverflow.com/a/7572668/15893674
    return (deltas1.x * deltas2.x + deltas1.y * deltas2.y)/(computeDistance(deltas1) * computeDistance(deltas2)) > 1 - EPSILON;
}
