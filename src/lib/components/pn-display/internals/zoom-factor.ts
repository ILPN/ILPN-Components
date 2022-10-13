export function zoomFactor(zoom: number): number {
    return Math.exp(zoom/1000);
}
