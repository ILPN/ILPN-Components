const ZOOM_CONST = 1000;

export function zoomFactor(zoom: number): number {
    return Math.exp(zoom/ZOOM_CONST);
}

export function inverseZoomFactor(factor: number): number {
    return Math.log(factor) * ZOOM_CONST;
}
