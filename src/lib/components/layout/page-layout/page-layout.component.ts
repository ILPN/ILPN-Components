import {Component, Input} from '@angular/core';
import {AnchorType, HeadingAnchorConfig} from './heading-anchor-config';

@Component({
    selector: 'ilpn-page-layout',
    templateUrl: './page-layout.component.html',
    styleUrls: ['./page-layout.component.scss']
})
export class PageLayoutComponent {

    @Input()
    public anchorConfig: HeadingAnchorConfig = {
        type: AnchorType.HREF
    };

    @Input()
    public hrBeforeFooter = true;

    @Input()
    public sourceLink?: string;

}
