import {Pipe, PipeTransform} from '@angular/core';
import {OriginAndZoom} from './model/origin-and-zoom';


@Pipe({
    name: 'viewBox'
})
export class ViewBoxPipe implements PipeTransform {

    transform(value: OriginAndZoom): string {
        return `${value.x} ${value.y} ${value.width * value.zoom} ${value.height * value.zoom}`;
    }

}
