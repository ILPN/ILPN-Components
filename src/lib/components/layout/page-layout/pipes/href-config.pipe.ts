import {Pipe, PipeTransform} from '@angular/core';
import {AnchorType, HeadingAnchorConfig} from '../heading-anchor-config';

@Pipe({
    name: 'hrefConfig'
})
export class HrefConfigPipe implements PipeTransform {

    transform(config: HeadingAnchorConfig, ...args: unknown[]): string | null {
        if (config.type === AnchorType.ROUTER) {
            return null;
        }
        if (config.link) {
            return config.link;
        }
        if (typeof args[0] === 'string') {
            return args[0];
        }
        throw Error('HeadingAnchorConfig provides no link and no default link was passed to the pipe');
    }

}
