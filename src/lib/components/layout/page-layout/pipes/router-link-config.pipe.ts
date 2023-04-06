import {Pipe, PipeTransform} from '@angular/core';
import {AnchorType, HeadingAnchorConfig} from '../heading-anchor-config';

@Pipe({
    name: 'routerLinkConfig'
})
export class RouterLinkConfigPipe implements PipeTransform {

    transform(config: HeadingAnchorConfig, ...args: unknown[]): string | null {
        if (config.type === AnchorType.HREF) {
            return null;
        }
        if (config.link) {
            return config.link;
        }
        throw Error('HeadingAnchorConfig provides no link');
    }

}
