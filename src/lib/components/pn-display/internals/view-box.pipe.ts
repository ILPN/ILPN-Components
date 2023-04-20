import {Pipe, PipeTransform} from '@angular/core';
import {OriginAndZoom} from './model/origin-and-zoom';
import {zoomFactor} from './zoom-factor';


@Pipe({
    name: 'viewBox'
})
export class ViewBoxPipe implements PipeTransform {

    transform(value: OriginAndZoom | null): string {
        if (value === null) {
            throw new Error('ViewBoxPipe value is null');
        }
        const factor = zoomFactor(value.zoom);
        return `${value.x} ${value.y} ${value.width * factor} ${value.height * factor}`;
    }

}
