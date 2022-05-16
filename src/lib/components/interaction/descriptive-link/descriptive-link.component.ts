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
    @Input() fileDisplay: FileDisplay | undefined;

    @Input() link: Array<string> | string | undefined;
    @Input() download = false;

    constructor(@Inject(APP_BASE_HREF) public baseHref: string) {
    }

    isAnchor(): boolean {
        return this.link !== undefined && !Array.isArray(this.link);
    }

    resolveAnchorLink(): string {
        return this.resolveSingleLink(this.link as string);
    }

    buttonClick() {
        if (this.link === undefined || this.isAnchor()) {
            return;
        }

        const links = (this.link as Array<string>).map(l => this.resolveSingleLink(l));

        for (const link of links) {
            this.createDownloadLink(link);
        }
    }

    private resolveSingleLink(link: string) {
        if (link.startsWith('http')) {
            return link;
        }
        return this.baseHref + link;
    }

    private createDownloadLink(link: string) {
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = link;
        a.download = '';
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

}
