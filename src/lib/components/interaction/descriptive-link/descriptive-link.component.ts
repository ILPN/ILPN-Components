import {Component, Inject, Input} from '@angular/core';
import {APP_BASE_HREF} from '@angular/common';
import {FileDisplay} from '../../layout/file-display';

@Component({
    selector: 'ilpn-descriptive-link',
    templateUrl: './descriptive-link.component.html',
    styleUrls: ['./descriptive-link.component.scss']
})
export class DescriptiveLinkComponent {

    @Input() squareContent: string = '?';
    @Input() title: string = '';
    @Input() description: string = '';
    @Input() link: string | undefined;
    @Input() fileDisplay: FileDisplay | undefined;
    @Input() download = false;

    constructor(@Inject(APP_BASE_HREF) public baseHref: string) {
    }

    resolveLink(): string {
        if (this.link === undefined) {
            return '';
        }
        if (this.link.startsWith('http')) {
            return this.link;
        }
        return this.baseHref + this.link;
    }

    resolveSquareContent(): string {
        if (this.fileDisplay !== undefined) {
            return this.fileDisplay.icon;
        }
        return this.squareContent;
    }

}
