import {Point} from "./point";

export interface BoundingBox {
    /**
     * Top left coordinate of the bounding box
     */
    tl: Point;
    /**
     * Bottom right coordinate of the bounding box
     */
    br: Point;
}
